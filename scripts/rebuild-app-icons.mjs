/**
 * Regenerate Folio app icons from SVG sources.
 * Master: docs/assets/folio-app-icon.svg
 * Small (16–32): docs/assets/folio-app-icon-small.svg
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

/** Pack PNG buffers into a multi-resolution ICO (PNG-in-ICO). */
function packPngIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let imageOffset = 6 + count * 16;
  for (const png of pngBuffers) {
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(imageOffset, 12);
    entries.push(entry);
    imageOffset += png.length;
  }
  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const masterSvg = path.join(root, "docs/assets/folio-app-icon.svg");
const smallSvg = path.join(root, "docs/assets/folio-app-icon-small.svg");
const tauriIcons = path.join(root, "src-tauri/icons");
const publicIcons = path.join(root, "public/icons");
const tauriBin = path.join(root, "node_modules/.bin/tauri");

function renderPng(svgPath, size) {
  const svg = fs.readFileSync(svgPath);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "transparent",
  });
  return resvg.render().asPng();
}

function writeRender(svgPath, size, outPath) {
  fs.writeFileSync(outPath, renderPng(svgPath, size));
}

function cleanTauriExtras() {
  for (const dir of ["ios", "android"]) {
    const p = path.join(tauriIcons, dir);
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  }
}

function buildIco() {
  const layers = [
    { size: 16, svg: smallSvg },
    { size: 24, svg: smallSvg },
    { size: 32, svg: smallSvg },
    { size: 48, svg: masterSvg },
    { size: 64, svg: masterSvg },
    { size: 128, svg: masterSvg },
    { size: 256, svg: masterSvg },
  ];
  const buffers = layers.map(({ size, svg }) => renderPng(svg, size));
  fs.writeFileSync(path.join(tauriIcons, "icon.ico"), packPngIco(buffers));
  return layers.map((l) => l.size);
}

async function main() {
  execSync(`"${tauriBin}" icon "${masterSvg}" -o "${tauriIcons}"`, {
    stdio: "inherit",
    cwd: root,
  });
  cleanTauriExtras();

  writeRender(smallSvg, 32, path.join(tauriIcons, "32x32.png"));

  const icoSizes = buildIco();

  for (const [name, size] of [
    ["icon-192.png", 192],
    ["icon-512.png", 512],
    ["apple-touch-icon.png", 180],
  ]) {
    writeRender(masterSvg, size, path.join(publicIcons, name));
  }

  console.log("ICO layers:", icoSizes.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});