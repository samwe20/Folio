# Development & testing

## Repository layout

```text
src/           UI, editor (CodeMirror), library logic
src-tauri/     Tauri 2 / Rust (Windows, iOS)
tests/         Node regression tests, Playwright e2e, desktop smoke (Windows CI)
docs/          Documentation and README screenshots
public/        PWA icons, manifest
```

### App icon (source SVG)

Vector sources (concept A):

- [`docs/assets/folio-app-icon.svg`](assets/folio-app-icon.svg) — master (≥48 px)
- [`docs/assets/folio-app-icon-small.svg`](assets/folio-app-icon-small.svg) — simplified for 16–32 px (larger book, thick spine, no margin line)

Regenerate **desktop / installer / PWA** icons:

```bash
npm run icons:rebuild
npm run icons:verify-ico   # 16–256 layers in icon.ico; 16–32 from small SVG
npm run icons:preview      # combined review PNGs in /opt/cursor/artifacts (local)
```

Squircle corners outside the shape are transparent (alpha 0). Taskbar contrast: slightly lighter fill `#2E3038` plus a subtle `stroke` on the squircle.

## Local checks

```bash
npm ci
npm run check      # tsc --noEmit
npm test           # 22 regression scenarios
npm run build
npm run test:offline
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

## CI (GitHub Actions)

Workflow [`.github/workflows/folio.yml`](../.github/workflows/folio.yml):

| Job | What it does |
|-----|----------------|
| **web** | check, test, build, offline, Playwright (desktop + mobile Chromium) |
| **windows** | NSIS build, install, real WebView2 smoke tests, release upload (`docs/release-latest.md` → GitHub release body) |

Refresh README screenshots: `npm run docs:screenshots`

## Version bumps

See **[release-versioning.md](release-versioning.md)** — stable `1.0.7` / `1.0.8` vs test builds `1.0.8-rc.N` (no patch bump per bugfix while testing).

Keep these in sync:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock` (after bump / build)

## Stack

- **Frontend:** Vite 6, TypeScript, CodeMirror 6
- **Desktop:** Tauri 2, WebView2
- **Preview:** Marked + DOMPurify ^3.4.17
- **UI:** Czech or English labels (`uiLocale` in settings, **English / Čeština** chip in the toolbar), light/dark themes (`src/styles.css`, `src/editor/theme.ts`)
