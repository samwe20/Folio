const { expect } = require("@playwright/test");

async function openLibrary(page) {
  const app = page.locator("#app");
  if ((await app.getAttribute("class"))?.includes("sidebar-collapsed")) {
    await page.locator("#btn-toggle-sidebar").click();
  }
}

async function openOverflowMenu(page) {
  await openLibrary(page);
  const trigger = page.locator("#btn-sidebar-menu");
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await expect(page.locator("#sidebar-menu")).toHaveClass(/open/);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

module.exports = { openLibrary, openOverflowMenu };
