const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");

require.extensions[".ts"] = (mod, filename) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText,
    filename,
  );

const { isDesktopUi, isMarketingDesktopCapture, MARKETING_DESKTOP_LIBRARY_LABEL } = require("../src/lib/runtime.ts");

test("marketing desktop capture flag enables desktop UI only in browser", () => {
  globalThis.window = { __FOLIO_MARKETING_DESKTOP__: true };
  assert.equal(isMarketingDesktopCapture(), true);
  assert.equal(isDesktopUi(), true);
  delete globalThis.window.__FOLIO_MARKETING_DESKTOP__;
  delete globalThis.window;
});

test("marketing library label looks like a Windows user folder", () => {
  assert.match(MARKETING_DESKTOP_LIBRARY_LABEL, /Documents[\\/]Folio[\\/]Library/);
});
