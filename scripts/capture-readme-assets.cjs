/**
 * Generates README screenshots from the production build (run after npm run build).
 * Usage: node scripts/capture-readme-assets.cjs
 */
const { chromium, devices } = require("@playwright/test");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const outDir = path.join(root, "docs", "assets");

function startServer() {
  const types = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".png": "image/png",
  };
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      const relative = decodeURIComponent(url.pathname).replace(/\/$/, "/index.html");
      const target = path.resolve(dist, "." + relative);
      if (!target.startsWith(dist + path.sep) && target !== dist) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = fs.readFileSync(target);
      res.setHeader("Content-Type", types[path.extname(target)] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(4173, "127.0.0.1", () => resolve(server));
  });
}

async function waitEditor(page) {
  await page.goto("http://127.0.0.1:4173/");
  await page.waitForSelector(".cm-content[contenteditable=true]", { timeout: 30000 });
  await page.waitForTimeout(800);
}

async function openSidebar(page) {
  const app = page.locator("#app");
  if ((await app.getAttribute("class"))?.includes("sidebar-collapsed")) {
    await page.locator("#btn-toggle-sidebar").click();
    await page.waitForTimeout(400);
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktop.newPage();

  await waitEditor(page);
  await openSidebar(page);
  await page.screenshot({ path: path.join(outDir, "folio-light-library.png") });

  await page.locator("#btn-theme").click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "folio-dark-library.png") });

  await page.locator("#btn-theme").click();
  await page.waitForTimeout(300);
  await page.locator(".note-item-title").first().click();
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

  await desktop.close();

  const iphone = devices["iPhone 13"];
  const mobile = await browser.newContext({
    ...iphone,
    deviceScaleFactor: 2,
  });
  const mpage = await mobile.newPage();
  await waitEditor(mpage);
  await mpage.locator("#btn-toggle-sidebar").click();
  await mpage.waitForTimeout(500);
  await mpage.screenshot({ path: path.join(outDir, "folio-mobile-library.png") });

  await browser.close();
  server.close();
  console.log("Saved screenshots to", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
