const { test, expect } = require("@playwright/test");
const path = require("node:path");
const { createDocsLandingServer } = require("../docs-landing-server.cjs");

const PORT = Number(process.env.DOCS_LANDING_PORT || 4174);
const baseURL = `http://127.0.0.1:${PORT}/`;

let server;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  server = createDocsLandingServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", resolve);
  });
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const locales = [
  { id: "cs", path: "/?lang=cs", title: /Folio/ },
  { id: "en", path: "/en/", title: /calm Markdown editor/i },
  { id: "de", path: "/de/", title: /ruhiger Markdown-Editor/i },
];

for (const locale of locales) {
  test(`landing ${locale.id} desktop`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      baseURL,
    });
    const page = await context.newPage();
    await page.goto(locale.path, { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(locale.title);
    await expect(page.locator(".lang-switch a[aria-current='true']")).toHaveText(
      locale.id === "cs" ? "CZ" : locale.id.toUpperCase()
    );
    const out = path.join("test-results", "landing", `${locale.id}-desktop.png`);
    await page.screenshot({ path: out, fullPage: true });
    await context.close();
  });

  test(`landing ${locale.id} mobile 390x844`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      baseURL,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto(locale.path, { waitUntil: "networkidle" });
    await expect(page.locator(".lang-switch")).toBeVisible();
    const out = path.join("test-results", "landing", `${locale.id}-mobile-390x844.png`);
    await page.screenshot({ path: out, fullPage: true });
    await context.close();
  });

  test(`landing ${locale.id} sync card inline strong desktop`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      baseURL,
    });
    const page = await context.newPage();
    await page.goto(locale.path, { waitUntil: "networkidle" });
    const syncCard = page.locator(".features li").nth(2);
    const oneDrive = syncCard.locator("strong").filter({ hasText: "OneDrive" });
    const iCloud = syncCard.locator("strong").filter({ hasText: "iCloud" });
    await expect(oneDrive).toBeVisible();
    await expect(iCloud).toBeVisible();
    await expect(oneDrive).toHaveCSS("display", "inline");
    await expect(iCloud).toHaveCSS("display", "inline");
    await expect(syncCard.locator(".feature-title")).toHaveCSS("display", "block");
    await syncCard.screenshot({
      path: path.join("test-results", "landing", `${locale.id}-sync-card-desktop.png`),
    });
    await context.close();
  });

  test(`landing ${locale.id} sync card inline strong mobile 390x844`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      baseURL,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto(locale.path, { waitUntil: "networkidle" });
    const syncCard = page.locator(".features li").nth(2);
    const oneDrive = syncCard.locator("strong").filter({ hasText: "OneDrive" });
    const iCloud = syncCard.locator("strong").filter({ hasText: "iCloud" });
    await expect(oneDrive).toHaveCSS("display", "inline");
    await expect(iCloud).toHaveCSS("display", "inline");
    await syncCard.screenshot({
      path: path.join("test-results", "landing", `${locale.id}-sync-card-mobile-390x844.png`),
    });
    await context.close();
  });
}
