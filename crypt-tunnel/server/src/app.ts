import * as net from "net";
import { createGzip, createUnzip } from "zlib";
import { CryptoSocket } from "./crypto-socket";
import { SyncReader } from "./sync-reader";

const AGENT_PORT = 9903;

/** 握手参数 */
interface HelloData {
  requestIp: string;
  requestPort: number;
}

async function onNewConnection(socket: net.Socket) {
  const srcHost = `${socket.remoteAddress}:${socket.remotePort}`;
  const src = new CryptoSocket(socket); // 加密
  src.on("error", (err) => err);
  // 获取连接参数
  let arg: HelloData;
  try {
    const reader = new SyncReader(src);
    const len = (await reader.read(4)).readUInt32BE();
    const json = (await reader.read(len)).toString();
    arg = JSON.parse(json) as HelloData;
  } catch {
    src.destroy(); // 连接断开
    return;
  }

  const dstHost = `${arg.requestIp}:${arg.requestPort}`;
  const dst = net.createConnection(arg.requestPort, arg.requestIp);
  dst.on("error", (err) => err);
  // 透传数据
  const gzip = createGzip({ flush: 1 });
  gzip.on("error", (err) => err);
  const ungzip = createUnzip({ flush: 1 });
  ungzip.on("error", (err) => err);
  src.pipe(ungzip).pipe(dst);
  dst.pipe(gzip).pipe(src);
  // 连接结束
  const msg = `${srcHost} -> ${dstHost}`;
  console.log("tunnel start", msg);
  let close = () => {
    close = () => null;
    console.log("tunnel close", msg);
  };
  src.on("close", () => close());
  dst.on("close", () => close());
}

function startServer() {
  const server = net.createServer(onNewConnection);
  server.listen(AGENT_PORT, "0.0.0.0");
  // 出错重启server
  server.on("error", () => setTimeout(startServer, 5000));
}
startServer();
