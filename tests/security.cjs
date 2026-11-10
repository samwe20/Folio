const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test, beforeEach, afterEach } = require("node:test");
const ts = require("typescript");
const { JSDOM } = require("jsdom");
const { indexedDB } = require("fake-indexeddb");
const root = path.resolve(__dirname, "..");

require.extensions[".ts"] = (mod, filename) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText,
    filename,
  );

/** OWASP / common Markdown XSS vectors (subset). */
const XSS_VECTORS = [
  '<img src=x onerror="window.__xss=1">',
  "<script>window.__xss=2</script>",
  '<a href="javascript:alert(1)">js</a>',
  '<a href="data:text/html,<script>alert(1)</script>">data</a>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<svg onload="alert(1)"></svg>',
  '<object data="data:text/html,<script>alert(1)</script>"></object>',
  '<img src="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' onload=alert(1)/>">',
  '<a href="//evil.example/leak">proto</a>',
  '<base href="https://evil.example">',
  '<link rel="stylesheet" href="https://evil.example/x.css">',
  "<math><mtext><table><mglyph><style><!--</style><img title=\"--&gt;<img src=x onerror=alert(1) &gt;\">",
  "[x](javascript:alert(1))",
  '<img src="file:///etc/passwd">',
  '<form action="https://evil.example"><input type="submit" value="x">',
  '<video><source src="https://evil.example/x.mp4"></video>',
  '<img srcset="https://evil.example/a.png 1x, https://evil.example/b.png 2x">',
];

let dom;
let window;
let document;

beforeEach(() => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8").replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  dom = new JSDOM(html, { url: "http://localhost/", pretendToBeVisual: true, runScripts: "dangerously" });
  window = dom.window;
  document = window.document;
  for (const key of [
    "window",
    "Window",
    "document",
    "navigator",
    "MutationObserver",
    "HTMLElement",
    "HTMLInputElement",
    "Node",
    "Element",
    "DOMException",
    "localStorage",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ]) {
    const value = /AnimationFrame|getComputedStyle/.test(key) ? dom.window[key].bind(dom.window) : dom.window[key];
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.indexedDB = indexedDB;
  delete window.__xss;
  for (const module of ["dompurify", "../src/lib/preview.ts", "../src/lib/safeUrl.ts", "../src/lib/zipPaths.ts"]) {
    try {
      delete require.cache[require.resolve(module)];
    } catch {}
  }
});

afterEach(() => {
  dom.window.close();
});

function assertNoExecutablePreview(html) {
  assert.equal(/<script\b/i.test(html), false, "script tag");
  assert.equal(/\son\w+\s*=/i.test(html), false, "inline event handler");
  assert.equal(/javascript:/i.test(html), false, "javascript: URL");
  assert.equal(/<iframe\b/i.test(html), false, "iframe");
  assert.equal(/<object\b/i.test(html), false, "object");
  assert.equal(/<embed\b/i.test(html), false, "embed");
  assert.equal(/<base\b/i.test(html), false, "base");
  assert.equal(/data:image\/svg/i.test(html), false, "svg data URI");
  assert.equal(/srcdoc=/i.test(html), false, "srcdoc");
  assert.equal(/<form\b/i.test(html), false, "form");
  assert.equal(/<video\b/i.test(html), false, "video");
}

test("preview sanitizes OWASP-style XSS vectors", () => {
  const { renderMarkdown } = require("../src/lib/preview.ts");
  const { NoteIndex } = require("../src/lib/noteIndex.ts");
  const index = new NoteIndex();
  index.setNotes([]);
  for (const payload of XSS_VECTORS) {
    const html = renderMarkdown(payload, index);
    assertNoExecutablePreview(html);
  }
});

test("preview blocks protocol-relative links and remote images by default", () => {
  const { renderMarkdown } = require("../src/lib/preview.ts");
  const { NoteIndex } = require("../src/lib/noteIndex.ts");
  const index = new NoteIndex();
  index.setNotes([]);
  const blocked = renderMarkdown('<a href="//evil.example">x</a>\n![t](https://allowed.example/i.png)', index, {
    allowRemoteImages: false,
    blockedImageLabel: "blocked",
  });
  assert.equal(/href="\/\/evil/.test(blocked), false);
  assert.match(blocked, /preview-img-placeholder/);
  assert.equal(/<img[^>]+src="https:\/\/allowed/i.test(blocked), false);
  const allowed = renderMarkdown("![t](https://allowed.example/i.png)", index, { allowRemoteImages: true });
  const localBlocked = renderMarkdown("![local](assets/shot.png)", index, {
    allowLocalImages: false,
    blockedImageLabel: "blocked",
  });
  assert.match(localBlocked, /data-remote-blocked="1"/);
  assert.doesNotMatch(localBlocked, /<img[^>]+src="assets\/shot\.png"/);
  assert.match(allowed, /https:\/\/allowed\.example\/i\.png/);
});

test("wiki titles cannot inject HTML metacharacters", () => {
  const { renderMarkdown } = require("../src/lib/preview.ts");
  const { NoteIndex } = require("../src/lib/noteIndex.ts");
  const index = new NoteIndex();
  index.setNotes([]);
  assert.match(renderMarkdown("[[Safe|alias]]", index), /data-wiki-title="Safe"/);
  for (const payload of ['[[x"><img>|y]]', "[[a<b>|z]]", '[[q"w|r]]']) {
    assert.equal(renderMarkdown(payload, index).includes("data-wiki-title"), false, payload);
  }
});

test("safeUrl helpers reject dangerous schemes", () => {
  const { isSafePreviewImageSrc, isSafePreviewLinkHref } = require("../src/lib/safeUrl.ts");
  assert.equal(isSafePreviewLinkHref("javascript:alert(1)"), false);
  assert.equal(isSafePreviewLinkHref("//evil.example"), false);
  assert.equal(isSafePreviewLinkHref("https://example.com"), true);
  assert.equal(isSafePreviewLinkHref("#anchor"), true);
  assert.equal(isSafePreviewImageSrc("file:///etc/passwd"), false);
  assert.equal(isSafePreviewImageSrc("data:image/svg+xml,<svg/>"), false);
  assert.equal(isSafePreviewImageSrc("data:image/png;base64,aaaa"), true);
  assert.equal(isSafePreviewImageSrc("assets/screenshot.png"), true);
  assert.equal(isSafePreviewImageSrc("../outside.png"), false);
  assert.equal(isSafePreviewImageSrc("https://cdn.example/x.png"), true);
});

test("zip entry paths reject zip-slip and non-markdown names", () => {
  const { isSafeZipEntryName, zipImportSizeAllowed, ZIP_IMPORT_MAX_UNCOMPRESSED_BYTES } = require("../src/lib/zipPaths.ts");
  assert.equal(isSafeZipEntryName("notes/ok.md"), true);
  assert.equal(isSafeZipEntryName("../escape.md"), false);
  assert.equal(isSafeZipEntryName("..\\escape.md"), false);
  assert.equal(isSafeZipEntryName("/etc/passwd.md"), false);
  assert.equal(isSafeZipEntryName("C:/Windows/win.ini"), false);
  assert.equal(isSafeZipEntryName("binary.exe"), false);
  assert.equal(zipImportSizeAllowed(ZIP_IMPORT_MAX_UNCOMPRESSED_BYTES), true);
  assert.equal(zipImportSizeAllowed(ZIP_IMPORT_MAX_UNCOMPRESSED_BYTES + 1), false);
});

test("import only accepts .md filenames", () => {
  const web = require("../src/lib/fs-web.ts");
  const { importMarkdownFiles } = require("../src/lib/disk.ts");
  const { WEB_LIBRARY_PATH } = require("../src/lib/runtime.ts");
  return (async () => {
    const md = new File(["# ok"], "note.md", { type: "text/markdown" });
    const txt = new File(["secret"], "note.txt", { type: "text/plain" });
    const paths = await importMarkdownFiles([md, txt], WEB_LIBRARY_PATH);
    assert.equal(paths.length, 1);
    for (const p of paths) await web.deleteNote(p);
  })();
});

test("relative note paths reject traversal segments", () => {
  const { assertSafeRelativeNotePath } = require("../src/lib/disk.ts");
  assert.doesNotThrow(() => assertSafeRelativeNotePath("folder/note.md"));
  for (const bad of ["../evil.md", "a/../b.md", "/abs.md", ""]) {
    assert.throws(() => assertSafeRelativeNotePath(bad), /Neplatná cesta/);
  }
});

test("draft journal enforces size limits and clears after successful save", async () => {
  const { rememberDraft, readDraft, forgetDraft } = require("../src/lib/drafts.ts");
  const { MAX_DRAFT_BYTES } = require("../src/lib/draftsLimits.ts");
  const path = "web://library/size-test.md";
  const huge = "x".repeat(MAX_DRAFT_BYTES + 1);
  assert.equal(await rememberDraft(path, "small"), true);
  assert.equal(await readDraft(path), "small");
  assert.equal(await rememberDraft(path, huge), false);
  await forgetDraft(path, "small");
  assert.equal(await readDraft(path), null);
});

test("web draft migration exports legacy localStorage keys", () => {
  const { DRAFT_STORAGE_PREFIX } = require("../src/lib/draftsLimits.ts");
  const { clearLegacyWebDraftKeys, purgeLegacyWebDraftKeys } = require("../src/lib/drafts-web.ts");
  localStorage.setItem(DRAFT_STORAGE_PREFIX + "web://library/legacy.md", "legacy text");
  const migrated = clearLegacyWebDraftKeys();
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].text, "legacy text");
  purgeLegacyWebDraftKeys();
  assert.equal(localStorage.getItem(DRAFT_STORAGE_PREFIX + "web://library/legacy.md"), null);
});

test("index.html ships a Content-Security-Policy for the PWA shell", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /base-uri 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /connect-src[^;]*ipc:/);
  assert.match(html, /connect-src[^;]*https:\/\/api\.github\.com/);
});
