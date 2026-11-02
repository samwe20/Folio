# Folio pro Windows

Nativní aplikace pro **Windows 10/11** (Tauri 2, WebView2, instalátor NSIS).

## Stáhnout

Nejnovější release: [GitHub Releases](https://github.com/samwe20/Folio/releases/latest)

Soubor `Folio_*_x64-setup.exe` je samostatný instalátor (ne zip). Po instalaci běží Folio offline; knihovna jsou běžné `.md` soubory na disku.

## Požadavky pro vývoj

| Nástroj | Poznámka |
|--------|----------|
| **Node.js** 22 LTS | `npm ci` |
| **Rust** | [rustup](https://rustup.rs/) |
| **WebView2** | Na Windows 11 obvykle už nainstalované |
| **Visual Studio Build Tools** | C++ workload, `link.exe` — ideálně **Developer PowerShell for VS** |

## Spuštění z kódu

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio
npm ci
npm run desktop:dev
```

## Sestavení instalátoru

```bash
npm run desktop:build -- --bundles nsis
```

Výstup: `src-tauri/target/release/bundle/nsis/*-setup.exe`

## Knihovna

- Výchozí cesta: `Dokumenty/Folio/Library`
- **Otevřít knihovnu** — libovolná složka (včetně OneDrive / iCloud Drive na Windows); přístup se pamatuje mezi restarty
- Export / import jednotlivých `.md` nebo celé knihovny (ZIP) v webové vrstvě UI

## Klávesové zkratky

| Zkratka | Akce |
|--------|------|
| `Ctrl+N` | Nová poznámka |
| `Ctrl+S` | Uložit |
| `Ctrl+D` | Focus Mode |
| `Esc` | Opustit Focus / zavřít vrstvy |
| `Ctrl+E` | Náhled |
| `Ctrl+P` | Rychlé otevření |
| `Ctrl+B` | Knihovna |
