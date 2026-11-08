# Folio for Windows

Native app for **Windows 10/11** (Tauri 2, WebView2, NSIS installer).

## Download

**Current version: 1.0.8**

| | |
|---|---|
| Installer | [Folio_1.0.8_x64-setup.exe](https://github.com/samwe20/Folio/releases/download/folio-1.0.8/Folio_1.0.8_x64-setup.exe) |
| Release page | [folio-1.0.8](https://github.com/samwe20/Folio/releases/tag/folio-1.0.8) |
| User notes (Czech + English) | [release-latest.md](release-latest.md) |

`Folio_*_x64-setup.exe` is a standalone installer (not a zip). After install, Folio runs offline; your library is ordinary `.md` files on disk.

## Windows blocks the installer (Smart App Control)

If Windows 11 **Smart App Control** says the app **may be unsafe** and there is no **Run anyway**, the installer is **unsigned** (no Authenticode publisher yet). That is expected until we ship a signed build.

**User guide (Czech + English):** [windows-smart-app-control.md](windows-smart-app-control.md)

**Maintainer plan (signing in CI):** [windows-code-signing.md](windows-code-signing.md)

## Development requirements

| Tool | Notes |
|------|--------|
| **Node.js** 22 LTS | `npm ci` |
| **Rust** | [rustup](https://rustup.rs/) |
| **WebView2** | Usually preinstalled on Windows 11 |
| **Visual Studio Build Tools** | C++ workload, `link.exe` — use **Developer PowerShell for VS** |

## Run from source

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio
npm ci
npm run desktop:dev
```

## Build the installer

```bash
npm run desktop:build -- --bundles nsis
```

Output: `src-tauri/target/release/bundle/nsis/*-setup.exe`

## Library

- Default path: `Documents/Folio/Library`
- **Open library** — any folder (including OneDrive / iCloud Drive on Windows); access persists across restarts
- Export / import single `.md` files or the whole library (ZIP) from the web layer in the UI

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New note |
| `Ctrl+S` | Save |
| `Ctrl+D` | Focus Mode |
| `Esc` | Exit Focus / close overlays |
| `Ctrl+E` | Preview |
| `Ctrl+P` | Quick open |
| `Ctrl+B` | Toggle library |
