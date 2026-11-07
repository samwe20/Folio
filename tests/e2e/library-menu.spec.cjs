const fs = require("node:fs");
const { test, expect } = require("@playwright/test");
const { unzipSync, strFromU8 } = require("fflate");
const { openLibrary, openOverflowMenu } = require("./helpers.cjs");
const editor = (page) => page.locator(".cm-content");

test.describe("library overflow menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./");
    await expect(editor(page)).toHaveAttribute("contenteditable", "true");
  });

  test("keyboard opens, navigates items and closes with Escape", async ({ page }) => {
    await openLibrary(page);
    await page.locator("#btn-sidebar-menu").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#btn-sidebar-menu")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#menu-export-library")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#menu-export-note")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#btn-sidebar-menu")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#sidebar-menu")).toHaveClass(/hidden/);
  });

  test("click outside closes the menu", async ({ page, isMobile }) => {
    await openOverflowMenu(page);
    if (isMobile) {
      await page.evaluate(() => {
        document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
    } else {
      await page.locator("#note-title").click();
    }
    await expect(page.locator("#btn-sidebar-menu")).toHaveAttribute("aria-expanded", "false");
  });

  test("export ZIP downloads a zip with markdown notes", async ({ page }) => {
    await editor(page).fill("# Export me\n\nBody");
    await expect(page.locator("#status-save")).toHaveText(/uloženo|saved/i);
    await openOverflowMenu(page);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#menu-export-library").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.zip$/i);
    const bytes = new Uint8Array(fs.readFileSync(await download.path()));
    const entries = unzipSync(bytes);
    const bodies = Object.entries(entries)
      .filter(([name]) => /\.md$/i.test(name))
      .map(([, data]) => strFromU8(data));
    expect(bodies.some((body) => /Export me/.test(body))).toBe(true);
  });

  test("export .md downloads the current note", async ({ page }) => {
    const title = `Export Note ${Date.now()}`;
    await page.locator("#note-title").fill(title);
    await page.locator("#note-title").press("Enter");
    await editor(page).fill("Single note export body");
    await expect(page.locator("#status-save")).toHaveText(/uloženo|saved/i);
    await openOverflowMenu(page);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#menu-export-note").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.md$/i);
    expect(fs.readFileSync(await download.path(), "utf8")).toContain("Single note export body");
  });

  test("import .md via menu accepts markdown and ignores other types", async ({ page }) => {
    const input = page.locator("#import-files");
    await openOverflowMenu(page);
    await page.locator("#menu-import-md").click();
    await input.setInputFiles({ name: "Legit.md", mimeType: "text/markdown", buffer: Buffer.from("from menu import") });
    await expect(editor(page)).toHaveText("from menu import");
    await openOverflowMenu(page);
    await page.locator("#menu-import-md").click();
    await input.setInputFiles([
      { name: "skip.txt", mimeType: "text/plain", buffer: Buffer.from("nope") },
      { name: "Second.md", mimeType: "text/markdown", buffer: Buffer.from("second import") },
    ]);
    await expect(editor(page)).toHaveText("second import");
    await expect(page.locator("#note-title")).toHaveValue("Second");
  });

  test("save to folder calls showDirectoryPicker when supported", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Directory picker mock targets Chromium");
    let called = false;
    await page.evaluate(() => {
      window.showDirectoryPicker = async () => {
        window.__folioPickerCalled = true;
        const file = { createWritable: async () => ({ write: async () => {}, close: async () => {} }) };
        return {
          getDirectoryHandle: async () => file,
          getFileHandle: async () => file,
        };
      };
    });
    await openOverflowMenu(page);
    const saveItem = page.locator("#menu-save-folder");
    if (await saveItem.isVisible()) {
      await saveItem.click();
      await expect(page.locator("#status-save")).toHaveText(/složk|folder/i);
      called = await page.evaluate(() => Boolean(window.__folioPickerCalled));
      expect(called).toBe(true);
    }
  });
});

test.describe("library overflow menu mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("./");
    await expect(editor(page)).toHaveAttribute("contenteditable", "true");
  });

  test("overflow menu is usable at 390×844", async ({ page }) => {
    await page.locator("#btn-toggle-sidebar").click();
    await expect(page.locator("#btn-sidebar-menu")).toBeVisible();
    await page.locator("#btn-sidebar-menu").click();
    await expect(page.locator('[role="menuitem"]:visible')).toHaveCount(4);
    await page.keyboard.press("Escape");
    await expect(page.locator("#sidebar-menu")).toHaveClass(/hidden/);
  });
});
