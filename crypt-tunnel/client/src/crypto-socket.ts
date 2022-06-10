import { Duplex, WritableOptions } from "stream";
import * as crypto from "crypto";

const _ = Buffer.from("jumhopasswordkey");

const BLOCK = 16;
const HEAD = Buffer.from("<?begn?>");

interface Context {
  socket: CryptoSocket;
  process: (ctx: Context) => number;
  buffer: Buffer;
  length: number;
}

function processHead(ctx: Context) {
  if (ctx.buffer.length < HEAD.length) return 0;
  const pos = ctx.buffer.indexOf(HEAD);
  if (pos === -1) {
    ctx.buffer = ctx.buffer.slice(0, -HEAD.length + 1);
    return 0;
  } else {
    ctx.process = processLength;
    return pos + HEAD.length;
  }
}

function processLength(ctx: Context) {
  if (ctx.buffer.length < 4) return 0;
  ctx.length = ctx.buffer.readUInt32BE();
  ctx.process = processContent;
  return 4;
}

function processContent(ctx: Context) {
  if (ctx.buffer.length === 0) {
    return 0;
  }
  const len = Math.min(ctx.length, ctx.buffer.length);
  ctx.socket.push(ctx.buffer.slice(0, len));
  ctx.length -= len;
  if (ctx.length === 0) {
    ctx.process = processHead;
  }
  return len;
}

export class CryptoSocket extends Duplex {
  encrypt = crypto.createCipheriv("aes-128-cbc", _, _);
  decrypt = crypto.createDecipheriv("aes-128-cbc", _, _);
  constructor(public socket: Duplex, opts?: WritableOptions) {
    super(opts);
    this.encrypt.setAutoPadding(false);
    this.decrypt.setAutoPadding(false);

    // 读数据
    const ctx = {
      socket: this,
      process: processHead,
      buffer: Buffer.alloc(0),
      length: 0,
    };
    let enBuf = Buffer.alloc(0);
    this.socket.on("data", (chunk: Buffer) => {
      // 解密
      enBuf = Buffer.concat([enBuf, chunk]);
      const span = enBuf.length % BLOCK;
      const deBuf = this.decrypt.update(enBuf.slice(0, -span || enBuf.length));
      ctx.buffer = Buffer.concat([ctx.buffer, deBuf]);
      enBuf = enBuf.slice(enBuf.length - span);
      // 处理数据
      let ret;
      while ((ret = ctx.process(ctx)) > 0) {
        ctx.buffer = ctx.buffer.slice(ret);
      }
    });
    this.socket.on("close", () => this.emit("close"));
    this.socket.on("error", (err) => this.emit("error", err));
    this.socket.on("connect", () => this.emit("connect"));
    this.socket.on("end", () => this.emit("end"));
  }
  async _writev(
    chunks: Array<{ chunk: Buffer; encoding: BufferEncoding }>,
    callback: (error?: Error | null) => void
  ) {
    const src = Buffer.concat(
      chunks.map((v) =>
        v.chunk instanceof Buffer ? v.chunk : Buffer.from(v.chunk, v.encoding)
      )
    );
    // 加密
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(src.length);

    const len = HEAD.length + lenBuf.length + src.length;
    let span = len % BLOCK;
    if (span !== 0) span = BLOCK - span;
    const data = Buffer.concat([HEAD, lenBuf, src, Buffer.alloc(span)]);
    this.socket.write(this.encrypt.update(data), callback);
  }
  _read = () => null;
  _destroy(error: Error | null) {
    this.socket.destroy(error || undefined);
  }
}
