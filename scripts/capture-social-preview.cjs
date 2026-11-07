/**
 * Builds docs/social-preview.png (1280×640) — run after npm run build.
 * Usage: node scripts/capture-social-preview.cjs
 */
const { chromium } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const {
  dist,
  startDistServer,
  prepareMarketingDesktopPage,
  openSidebarIfCollapsed,
} = require("./capture-marketing-helpers.cjs");

const outPath = path.join(__dirname, "..", "docs", "social-preview.png");
const tmpBg = path.join(__dirname, "..", "docs", ".social-preview-bg.png");
const baseUrl = "http://127.0.0.1:4173/";

async function captureAppScreenshot() {
  if (!fs.existsSync(dist)) {
    throw new Error("Missing dist/ — run npm run build first");
  }
  const server = await startDistServer(4173);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await prepareMarketingDesktopPage(context, baseUrl);
  await openSidebarIfCollapsed(page);
  await page.locator(".note-item-title", { hasText: "Welcome to Folio" }).click();
  await page.waitForTimeout(500);

  const backlinks = page.locator("#btn-backlinks");
  if ((await backlinks.getAttribute("aria-pressed")) !== "true") {
    await backlinks.click();
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: tmpBg, fullPage: false, animations: "disabled" });
  await browser.close();
  server.close();
}

function compositeHtml(bgBase64) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 1280px; height: 640px; overflow: hidden; background: #e8e2d6; }
  .frame {
    position: relative;
    width: 1280px;
    height: 640px;
    overflow: hidden;
  }
  .shot {
    position: absolute;
    right: -40px;
    top: 0;
    height: 640px;
    width: auto;
    object-fit: cover;
    object-position: right center;
    z-index: 1;
  }
  .shade {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(
      90deg,
      #f3efe4 0%,
      #f3efe4 42%,
      rgba(243, 239, 228, 0.97) 50%,
      rgba(243, 239, 228, 0.55) 62%,
      rgba(243, 239, 228, 0) 78%
    );
    pointer-events: none;
  }
  .copy {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 3;
    width: 620px;
    height: 640px;
    padding: 52px 48px 48px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-family: "Segoe UI", system-ui, sans-serif;
  }
  .copy h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 76px;
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: #2c2a26;
    margin-bottom: 18px;
  }
  .copy .lead {
    font-size: 30px;
    font-weight: 600;
    line-height: 1.3;
    color: #3d5a73;
    margin-bottom: 18px;
    max-width: 520px;
  }
  .copy .tag {
    font-size: 21px;
    font-weight: 400;
    line-height: 1.45;
    color: #6f6a60;
    max-width: 500px;
  }
</style>
</head>
<body>
  <div class="frame" id="frame">
    <img class="shot" src="data:image/png;base64,${bgBase64}" width="1440" height="900" alt="" />
    <div class="shade" aria-hidden="true"></div>
    <div class="copy">
      <h1>Folio</h1>
      <p class="lead">A calm Markdown editor for Windows</p>
      <p class="tag">Focused writing inspired by iA Writer. Backlinks inspired by Obsidian.</p>
    </div>
  </div>
</body>
</html>`;
}

async function composeSocialPreview() {
  const bgBase64 = fs.readFileSync(tmpBg).toString("base64");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 640 },
    deviceScaleFactor: 1,
  });
  await page.setContent(compositeHtml(bgBase64), { waitUntil: "load" });
  await page.locator("#frame").screenshot({ path: outPath, type: "png", animations: "disabled" });
  await browser.close();
  fs.unlinkSync(tmpBg);
  const bytes = fs.statSync(outPath).size;
  console.log("Wrote", outPath, `(${Math.round(bytes / 1024)} KiB)`);
  if (bytes > 1024 * 1024) {
    throw new Error(`social-preview.png exceeds 1 MB (${bytes} bytes)`);
  }
}

async function main() {
  await captureAppScreenshot();
  await composeSocialPreview();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
