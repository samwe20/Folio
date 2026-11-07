const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const DESKTOP_LIBRARY_LABEL = "C:\\Users\\Demo\\Documents\\Folio\\Library";

const MARKETING_SETTINGS = {
  libraryPath: null,
  theme: "light",
  focusMode: false,
  typewriter: false,
  showBacklinks: true,
  lastOpenPath: null,
  editorFont: "literata",
  sortBy: "title",
  sortDirection: "asc",
  uiLocale: "en",
};

function startDistServer(port = 4173) {
  const types = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".png": "image/png",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
  };
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
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
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function marketingInitScript() {
  return ({ settings }) => {
    window.__FOLIO_MARKETING_DESKTOP__ = true;
    localStorage.setItem("folio.settings.v1", JSON.stringify(settings));
    document.addEventListener(
      "DOMContentLoaded",
      () => document.getElementById("update-notice")?.classList.add("hidden"),
      { once: true },
    );
  };
}

async function clearIndexedDb(page) {
  await page.evaluate(async () => {
    if (!indexedDB.databases) return;
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(
        (db) =>
          new Promise((resolve) => {
            const req = indexedDB.deleteDatabase(db.name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          }),
      ),
    );
  });
}

async function prepareMarketingDesktopPage(context, baseUrl) {
  await context.addInitScript(marketingInitScript(), { settings: MARKETING_SETTINGS });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector(".cm-content[contenteditable=true]", { timeout: 30000 });
  await page.waitForTimeout(600);
  await openSidebarIfCollapsed(page);
  await expectDesktopChrome(page);
  return page;
}

async function expectDesktopChrome(page) {
  await page.waitForFunction(
    () => {
      const overflow = document.getElementById("sidebar-overflow");
      if (!overflow) return true;
      const hidden =
        overflow.classList.contains("hidden") || getComputedStyle(overflow).display === "none";
      return hidden;
    },
    { timeout: 15000 },
  );
  const text = await page.locator("#library-path").textContent();
  if (!text || !/Documents[\\/].*Folio/i.test(text)) {
    throw new Error(`Expected desktop library path label, got: ${text}`);
  }
  await page.waitForFunction(() => {
    const bar = document.getElementById("update-notice");
    if (!bar) return true;
    return bar.classList.contains("hidden") || getComputedStyle(bar).display === "none";
  });
}

async function openSidebarIfCollapsed(page) {
  const app = page.locator("#app");
  if ((await app.getAttribute("class"))?.includes("sidebar-collapsed")) {
    await page.locator("#btn-toggle-sidebar").click();
    await page.waitForTimeout(400);
  }
}

module.exports = {
  DESKTOP_LIBRARY_LABEL,
  MARKETING_SETTINGS,
  dist,
  root,
  startDistServer,
  marketingInitScript,
  clearIndexedDb,
  prepareMarketingDesktopPage,
  expectDesktopChrome,
  openSidebarIfCollapsed,
};
