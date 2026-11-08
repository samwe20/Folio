## Folio 1.0.7 — Windows

**Instalátor:** [Folio_1.0.7_x64-setup.exe](https://github.com/samwe20/Folio/releases/download/folio-1.0.7/Folio_1.0.7_x64-setup.exe)  
**Požadavky:** Windows 10 nebo 11 (WebView2 — na Windows 11 obvykle už nainstalovaný)

### Co je nového

- **Menu v liště (☰)** — verze aplikace, ruční kontrola aktualizací, export knihovny (ZIP) a aktuální poznámky (.md), přepínače vzdálených obrázků v náhledu (globálně i pro poznámku).
- **Obrázky v poznámkách** — přetáhněte nebo vložte PNG/JPEG/GIF/WebP do editoru; na desktopu se uloží do složky `assets/` v knihovně a vloží se Markdown odkaz; v náhledu fungují lokální cesty.
- **Ukázkový tutoriál** — poznámky po prvním spuštění (demo knihovna) jsou vždy **anglicky**, bez ohledu na jazyk rozhraní.
- **Upozornění na aktualizace** — ruční kontrola v menu ignoruje 24hodinové omezení i dříve odloženou verzi.

### Instalace

1. Stáhněte `Folio_1.0.7_x64-setup.exe` z odkazu výše (nebo ze [stránky release](https://github.com/samwe20/Folio/releases/tag/folio-1.0.7)).
2. Spusťte instalátor (samostatný NSIS setup, ne zip).
3. Po spuštění Folio vytvoří knihovnu v `Dokumenty/Folio/Library` — nebo zvolte **Otevřít knihovnu** a vyberte složku s `.md` soubory (včetně OneDrive / iCloud Drive ve Windows).

**Windows 11 blokuje instalaci?** Smart App Control může nepodepsaný instalátor odmítnout. Návod: [docs/windows-smart-app-control.md](https://github.com/samwe20/Folio/blob/main/docs/windows-smart-app-control.md) (dočasně vypnout SAC, nebo sestavit ze zdrojů). Trvalé řešení: podpis instalátoru — [docs/windows-code-signing.md](https://github.com/samwe20/Folio/blob/main/docs/windows-code-signing.md).

### Tipy

- **Focus Mode** — celá obrazovka pro psaní; volitelný typewriter.
- **`[[Wiki odkazy]]`** — dvojklik pro otevření; panel zpětných odkazů vpravo.
- **Menu ☰** vpravo v liště — export, nastavení náhledu a informace o programu.

---

## Folio 1.0.7 — Windows (English)

**Installer:** [Folio_1.0.7_x64-setup.exe](https://github.com/samwe20/Folio/releases/download/folio-1.0.7/Folio_1.0.7_x64-setup.exe)  
**Requirements:** Windows 10 or 11 (WebView2 — usually preinstalled on Windows 11)

### What's new

- **Toolbar app menu (☰)** — app version, manual update check, export library (ZIP) and current note (.md), remote image toggles for preview (global and per-note).
- **Images in notes** — drag or paste PNG/JPEG/GIF/WebP into the editor; on desktop files go under `assets/` in your library with a Markdown link; local paths work in preview.
- **Sample tutorial** — first-run demo notes are always **English**, regardless of UI language.
- **Updates** — manual check from the menu bypasses the 24-hour limit and previously dismissed versions.

### Install

1. Download `Folio_1.0.7_x64-setup.exe` from the link above (or the [release page](https://github.com/samwe20/Folio/releases/tag/folio-1.0.7)).
2. Run the standalone NSIS installer.
3. On first launch Folio uses `Documents/Folio/Library` by default — or use **Open library** to pick any folder of `.md` files (including OneDrive / iCloud Drive on Windows).

**Installer blocked on Windows 11?** See [windows-smart-app-control.md](https://github.com/samwe20/Folio/blob/main/docs/windows-smart-app-control.md). Signing roadmap: [windows-code-signing.md](https://github.com/samwe20/Folio/blob/main/docs/windows-code-signing.md).

### Tips

- **Focus Mode** — fullscreen writing; optional typewriter scrolling.
- **`[[Wiki links]]`** — double-click to open; backlinks panel on the right.
- **☰ menu** on the right of the toolbar — export, preview settings, and about.
