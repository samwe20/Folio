# Vývoj a testy

## Struktura repozitáře

```text
src/           UI, editor (CodeMirror), logika knihovny
src-tauri/     Tauri 2 / Rust (Windows, iOS)
tests/         Regresní testy (Node), Playwright e2e, desktop smoke (Windows CI)
docs/          Dokumentace a screenshoty pro README
public/        Ikony PWA, manifest
```

## Lokální kontrola

```bash
npm ci
npm run check      # tsc --noEmit
npm test           # 22 regresních scénářů
npm run build
npm run test:offline
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

## CI (GitHub Actions)

Workflow [`.github/workflows/folio.yml`](../.github/workflows/folio.yml):

| Job | Co dělá |
|-----|---------|
| **web** | check, test, build, offline, Playwright (desktop + mobile Chromium) |
| **windows** | NSIS build, instalace, smoke test reálného WebView2, publikace release |

Screenshoty pro README: `npm run build && node scripts/capture-readme-assets.cjs`

## Verze

Synchronizuj v těchto souborech:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock` (po bumpu `cargo update` / build)

## Stack

- **Frontend:** Vite 6, TypeScript, CodeMirror 6
- **Desktop:** Tauri 2, WebView2
- **Preview:** Marked + DOMPurify ^3.4.17
- **UI:** česky, světlý/tmavý režim (viz `src/styles.css`, `src/editor/theme.ts`)
