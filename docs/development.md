# Development & testing

## Repository layout

```text
src/           UI, editor (CodeMirror), library logic
src-tauri/     Tauri 2 / Rust (Windows, iOS)
tests/         Node regression tests, Playwright e2e, desktop smoke (Windows CI)
docs/          Documentation and README screenshots
public/        PWA icons, manifest
```

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
