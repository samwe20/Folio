import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const icoPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src-tauri/icons/icon.ico",
);

const buf = fs.readFileSync(icoPath);
if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
  throw new Error("Not a valid ICO");
}
const count = buf.readUInt16LE(4);
const sizes = [];
for (let i = 0; i < count; i++) {
  const off = 6 + i * 16;
  const w = buf.readUInt8(off) || 256;
  const h = buf.readUInt8(off + 1) || 256;
  sizes.push(`${w}x${h}`);
}
console.log(`icon.ico: ${count} layers → ${sizes.join(", ")}`);