import * as net from "net";
import { createGzip, createUnzip } from "zlib";
import { CryptoSocket } from "./crypto-socket";

const AGENT_PORT = 9903;

interface Request {
  localPort: number;
  agentIp: string;
  requestIp: string;
  requestPort: number;
}

function getRequest() {
  if (process.argv.length < 5) {
    console.log("command:");
    console.log(
      "node agent-client.js <local-port> <agent-ip> <request-ip> <request-port>"
    );
    process.exit(1);
  }
  return {
    localPort: Number(process.argv[2]),
    agentIp: process.argv[3],
    requestIp: process.argv[4],
    requestPort: Number(process.argv[5]),
  } as Request;
}

async function createTunnel(req: Request) {
  const dstHost = `${req.requestIp}:${req.requestPort}`;
  const server = net.createServer();
  server.listen(req.localPort, "0.0.0.0");

  server.on("connection", (src) => {
    const srcHost = `${src.remoteAddress}:${src.remotePort}`;
    src.on("error", (err) => err);

    const socket = net.createConnection(AGENT_PORT, req.agentIp);
    const dst = new CryptoSocket(socket);
    dst.on("error", (err) => err);
    let pxyHost: string;
    dst.on("connect", () => {
      pxyHost = `${socket.localAddress}:${socket.localPort}`;
      console.log("tunnel start", `${srcHost} -> ${pxyHost} -> ${dstHost}`);
      // 发送连接参数
      const arg = {
        requestIp: req.requestIp,
        requestPort: req.requestPort,
      };
      const jsonBuf = Buffer.from(JSON.stringify(arg));
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(jsonBuf.length);
      dst.write(Buffer.concat([lenBuf, jsonBuf]), (err) => err);
      // 透传数据
      const gzip = createGzip({ flush: 1 });
      gzip.on("error", (err) => err);
      const ungzip = createUnzip({ flush: 1 });
      ungzip.on("error", (err) => err);
      src.pipe(gzip).pipe(dst);
      dst.pipe(ungzip).pipe(src);
    });
    // 连接结束
    let close = () => {
      close = () => null;
      if (srcHost) {
        console.log("tunnel close", `${srcHost} -> ${pxyHost} -> ${dstHost}`);
      } else {
        console.log("tunnel open error", `${srcHost} -> ${dstHost}`);
      }
    };
    src.on("close", () => close());
    dst.on("close", () => close());
  });
}

async function main() {
  const req = getRequest();
  createTunnel(req);
}
main();
