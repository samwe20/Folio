/**
 * Write combined icon previews to /opt/cursor/artifacts for PR review.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = "/opt/cursor/artifacts";
const masterSvg = fs.readFileSync(path.join(root, "docs/assets/folio-app-icon.svg"));
const smallSvg = fs.readFileSync(path.join(root, "docs/assets/folio-app-icon-small.svg"));

function render(svgBuf, size) {
  const resvg = new Resvg(svgBuf, {
    fitTo: { mode: "width", value: size },
    background: "transparent",
  });
  return resvg.render().asPng();
}

function upscaleNearest(pngBuf, from, to) {
  return sharp(pngBuf)
    .resize(to, to, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
}

async function compositeRow(items, bgHex) {
  const pad = 24;
  const gap = 20;
  const imgs = await Promise.all(
    items.map(async ({ label, buf }) => {
      const meta = await sharp(buf).metadata();
      return { label, buf, w: meta.width, h: meta.height };
    }),
  );
  const w = imgs.reduce((s, i) => s + i.w, 0) + gap * (imgs.length - 1) + pad * 2;
  const h = Math.max(...imgs.map((i) => i.h)) + pad * 2 + 28;
  const composites = [];
  let x = pad;
  const midY = pad + 14;
  for (const im of imgs) {
    const y = midY + (Math.max(...imgs.map((i) => i.h)) - im.h) / 2;
    composites.push({ input: im.buf, left: Math.round(x), top: Math.round(y) });
    x += im.w + gap;
  }
  return sharp({
    create: {
      width: Math.round(w),
      height: Math.round(h),
      channels: 4,
      background: bgHex,
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const png256 = render(masterSvg, 256);
  const png32 = render(smallSvg, 32);
  const png16 = render(smallSvg, 16);
  const up32 = await upscaleNearest(png32, 32, 128);
  const up16 = await upscaleNearest(png16, 16, 128);

  for (const [name, buf] of [
    ["folio-icon-256.png", png256],
    ["folio-icon-32.png", png32],
    ["folio-icon-16.png", png16],
    ["folio-icon-32-nearest-128.png", up32],
    ["folio-icon-16-nearest-128.png", up16],
  ]) {
    fs.writeFileSync(path.join(outDir, name), buf);
  }

  const rowItems = [
    { buf: png256 },
    { buf: png32 },
    { buf: png16 },
    { buf: up32 },
    { buf: up16 },
  ];
  const light = await compositeRow(rowItems, "#E8E8E8");
  const dark = await compositeRow(rowItems, "#20242A");
  fs.writeFileSync(path.join(outDir, "folio-icon-preview-light.png"), light);
  fs.writeFileSync(path.join(outDir, "folio-icon-preview-dark.png"), dark);
  fs.writeFileSync(
    path.join(outDir, "folio-icon-preview-combined.png"),
    await sharp({
      create: {
        width: (await sharp(light).metadata()).width,
        height: (await sharp(light).metadata()).height * 2 + 16,
        channels: 4,
        background: "#FFFFFF",
      },
    })
      .composite([
        { input: light, top: 0, left: 0 },
        { input: dark, top: (await sharp(light).metadata()).height + 16, left: 0 },
      ])
      .png()
      .toBuffer(),
  );

  const corner = await sharp(render(masterSvg, 512))
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer();
  console.log("Corner alpha (512px master):", corner[3] ?? "n/a");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});