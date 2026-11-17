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
import toIco from "to-ico";

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

async function buildIco() {
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
  const ico = await toIco(buffers, { resize: false });
  fs.writeFileSync(path.join(tauriIcons, "icon.ico"), ico);
  return layers.map((l) => l.size);
}

async function main() {
  execSync(`"${tauriBin}" icon "${masterSvg}" -o "${tauriIcons}"`, {
    stdio: "inherit",
    cwd: root,
  });
  cleanTauriExtras();

  writeRender(smallSvg, 32, path.join(tauriIcons, "32x32.png"));

  const icoSizes = await buildIco();

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