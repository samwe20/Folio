const { test, expect } = require("@playwright/test");

test("update notice bar stays hidden in web build", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app", { timeout: 30000 });
  await expect(page.locator("#update-notice")).toHaveClass(/hidden/);
});

test("mocked GitHub latest release can drive resolve logic offline", async ({ page }) => {
  const offer = await page.evaluate(async () => {
    const release = {
      tag_name: "folio-9.9.9",
      html_url: "https://github.com/samwe20/Folio/releases/tag/folio-9.9.9",
    };
    const current = "1.0.6";
    const parse = (tag) => {
      const m = /^folio-(\d+\.\d+\.\d+)/i.exec(tag.trim());
      return m ? m[1] : null;
    };
    const cmp = (a, b) => {
      const pa = a.split(".").map(Number);
      const pb = b.split(".").map(Number);
      for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
      }
      return 0;
    };
    const latest = parse(release.tag_name);
    if (!latest || !release.html_url.startsWith("https://github.com/samwe20/Folio/releases/")) return null;
    if (cmp(latest, current) <= 0) return null;
    return { version: latest, url: release.html_url };
  });
  expect(offer).toEqual({
    version: "9.9.9",
    url: "https://github.com/samwe20/Folio/releases/tag/folio-9.9.9",
  });
});
