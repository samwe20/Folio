const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
const path = require("node:path");
const fs = require("node:fs");
const root = path.resolve(__dirname, "..");

require.extensions[".ts"] = (mod, filename) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText,
    filename,
  );

const { compareSemver, parseFolioReleaseTag } = require("../src/lib/semver.ts");
const { isSafeFolioReleaseUrl } = require("../src/lib/openRelease.ts");
const {
  resolveUpdateOffer,
  shouldCheckForUpdate,
  markUpdateChecked,
  UPDATE_CHECK_COOLDOWN_MS,
} = require("../src/lib/updateNotice.ts");

test("parseFolioReleaseTag accepts folio-X.Y.Z tags", () => {
  assert.equal(parseFolioReleaseTag("folio-1.0.6"), "1.0.6");
  assert.equal(parseFolioReleaseTag("folio-2.0.0-beta.1"), "2.0.0");
  assert.equal(parseFolioReleaseTag("v1.0.6"), null);
});

test("compareSemver orders versions", () => {
  assert.ok(compareSemver("1.0.6", "1.0.5") > 0);
  assert.ok(compareSemver("1.0.5", "1.0.6") < 0);
  assert.equal(compareSemver("1.0.6", "1.0.6"), 0);
});

test("isSafeFolioReleaseUrl only allows Folio release pages", () => {
  assert.ok(isSafeFolioReleaseUrl("https://github.com/samwe20/Folio/releases/tag/folio-1.0.6"));
  assert.equal(isSafeFolioReleaseUrl("https://evil.example/releases/tag/folio-1.0.6"), false);
});

test("resolveUpdateOffer skips current, invalid, and dismissed versions", () => {
  const release = {
    tag_name: "folio-1.0.7",
    html_url: "https://github.com/samwe20/Folio/releases/tag/folio-1.0.7",
  };
  assert.deepEqual(resolveUpdateOffer("1.0.6", release), { version: "1.0.7", url: release.html_url });
  assert.equal(resolveUpdateOffer("1.0.7", release), null);
  assert.equal(resolveUpdateOffer("1.0.6", { tag_name: "broken", html_url: release.html_url }), null);
});

test("resolveUpdateOffer can ignore dismissed version for manual check", () => {
  const dom = new (require("jsdom").JSDOM)("", { url: "http://localhost/" });
  globalThis.localStorage = dom.window.localStorage;
  const { dismissUpdateVersion, UPDATE_DISMISS_STORAGE_KEY } = require("../src/lib/updateNotice.ts");
  dismissUpdateVersion("1.0.7");
  const release = {
    tag_name: "folio-1.0.7",
    html_url: "https://github.com/samwe20/Folio/releases/tag/folio-1.0.7",
  };
  assert.equal(resolveUpdateOffer("1.0.6", release), null);
  assert.ok(resolveUpdateOffer("1.0.6", release, { ignoreDismiss: true }));
  localStorage.removeItem(UPDATE_DISMISS_STORAGE_KEY);
});

test("shouldCheckForUpdate respects 24h cooldown", () => {
  const dom = new (require("jsdom").JSDOM)("", { url: "http://localhost/" });
  globalThis.localStorage = dom.window.localStorage;
  const now = 1_700_000_000_000;
  assert.equal(shouldCheckForUpdate(now), true);
  markUpdateChecked(now);
  assert.equal(shouldCheckForUpdate(now + UPDATE_CHECK_COOLDOWN_MS - 1), false);
  assert.equal(shouldCheckForUpdate(now + UPDATE_CHECK_COOLDOWN_MS), true);
});
