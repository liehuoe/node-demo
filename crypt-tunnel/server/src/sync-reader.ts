import { Readable } from "stream";

export class SyncReader {
  constructor(public reader: Readable) {
    reader.pause();
  }
  async read(size?: number) {
    if (size === 0) return Buffer.alloc(0);
    let data = this.reader.read(size);
    if (data !== null) return data as Buffer;
    // 等待足够数据
    return new Promise<Buffer>((resolve, reject) => {
      const callback = () => {
        data = this.reader.read(size);
        if (this.reader.destroyed) reject(new Error("connect closed"));
        else if (data !== null) resolve(data as Buffer);
        else this.reader.once("readable", callback);
      };
      this.reader.once("readable", callback);
    });
  }
}
