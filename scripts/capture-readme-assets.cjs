/**
 * Generates README / docs marketing screenshots from the production build.
 * Renders desktop (Windows) UI — not web/PWA chrome.
 * Usage: node scripts/capture-readme-assets.cjs
 */
const { chromium } = require("@playwright/test");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const {
  dist,
  startDistServer,
  prepareMarketingDesktopPage,
  openSidebarIfCollapsed,
} = require("./capture-marketing-helpers.cjs");

const outDir = path.join(__dirname, "..", "docs", "assets");
const baseUrl = "http://127.0.0.1:4173/";

async function recordDemoClip(outGif, outMp4) {
  const demoDir = path.join(outDir, ".demo-capture");
  fs.mkdirSync(demoDir, { recursive: true });
  const videoDir = path.join(demoDir, "video");
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  const vpage = await prepareMarketingDesktopPage(context, baseUrl);
  await openSidebarIfCollapsed(vpage);
  await vpage.locator(".note-item-title", { hasText: "Welcome to Folio" }).click();
  await vpage.waitForTimeout(500);
  await vpage.locator(".cm-content").click();
  await vpage.keyboard.type(" — wiki links keep ideas connected.", { delay: 35 });
  await vpage.waitForTimeout(400);
  await vpage.locator("#btn-preview").click();
  await vpage.waitForTimeout(700);
  await vpage.locator("#btn-backlinks").click();
  await vpage.waitForTimeout(700);
  const video = vpage.video();
  await context.close();
  await browser.close();

  const webmPath = await video.path();
  execFileSync(
    "ffmpeg",
    ["-y", "-i", webmPath, "-movflags", "+faststart", "-pix_fmt", "yuv420p", outMp4],
    { stdio: "pipe" },
  );
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      outMp4,
      "-vf",
      "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
      outGif,
    ],
    { stdio: "pipe" },
  );
}

async function main() {
  if (!fs.existsSync(dist)) {
    throw new Error("Missing dist/ — run npm run build first");
  }
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startDistServer(4173);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await prepareMarketingDesktopPage(context, baseUrl);
  await openSidebarIfCollapsed(page);
  await page.screenshot({ path: path.join(outDir, "folio-light-library.png") });

  await page.locator("#btn-theme").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "folio-dark-library.png") });

  await page.locator("#btn-theme").click();
  await page.waitForTimeout(300);
  await page.locator(".note-item-title", { hasText: "Welcome to Folio" }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "folio-writing-light.png"), fullPage: false });

  await page.locator("#btn-backlinks").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "folio-backlinks.png") });

  await page.locator("#btn-backlinks").click();
  await page.locator("#btn-preview").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "folio-preview.png") });

  await page.locator("#btn-preview").click();
  await page.locator("#btn-focus").click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, "folio-focus-mode.png") });

  await browser.close();

  const gifPath = path.join(outDir, "folio-demo.gif");
  const mp4Path = path.join(outDir, "folio-demo.mp4");
  await recordDemoClip(gifPath, mp4Path);

  server.close();

  const mobilePath = path.join(outDir, "folio-mobile-library.png");
  if (fs.existsSync(mobilePath)) fs.unlinkSync(mobilePath);

  console.log("Saved desktop marketing assets to", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
