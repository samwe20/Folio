## Folio 1.0.6 — Windows

**Instalátor:** [Folio_1.0.6_x64-setup.exe](https://github.com/samwe20/Folio/releases/download/folio-1.0.6/Folio_1.0.6_x64-setup.exe)  
**Požadavky:** Windows 10 nebo 11 (WebView2 — na Windows 11 obvykle už nainstalovaný)

### Co je nového

- **Bezpečnější náhled Markdownu** — přísnější sanitizace HTML (DOMPurify), blokace rizikových značek a atributů; nebezpečné odkazy se odstraní; vzdálené obrázky (`http`/`https`) jsou ve výchozím stavu vypnuté a v náhledu se zobrazí nahrazení — globální přepínač a přepis pro aktuální poznámku v liště náhledu.
- **Desktop: přístup jen ke knihovně** — po výběru složky knihovny Folio rozšíří oprávnění filesystemu pouze na tuto cestu (bez širokého přístupu k celým Dokumentům, Ploše apod.); odebrán plugin pro otevírání libovolných URL z výchozích oprávnění.
- **Import a export** — ochrana proti zip-slip a nadměrně velkým archivům; import souborů jen s příponou `.md`; kontrola relativních cest při ukládání knihovny do složky.
- **Menu knihovny ⋯** — export ZIP, export poznámky, import `.md` a (kde prohlížeč podporuje) uložení do složky jsou v přetečeném menu u stromu souborů místo řady tlačítek v postranním panelu.
- **Stránka projektu** — vícejazyčná landing page (čeština, angličtina, němčina) na GitHub Pages pro stažení a přehled funkcí.
- **Upozornění na novou verzi (Windows)** — desktop jednou za 24 hodin (max.) zkontroluje GitHub Releases; pokud je dostupnější verze, zobrazí klidný pruh s odkazem ke stažení (bez automatické instalace, bez telemetrie).

### Instalace

1. Stáhněte `Folio_1.0.6_x64-setup.exe` z odkazu výše (nebo ze [stránky release](https://github.com/samwe20/Folio/releases/tag/folio-1.0.6)).
2. Spusťte instalátor (samostatný NSIS setup, ne zip).
3. Po spuštění Folio vytvoří knihovnu v `Dokumenty/Folio/Library` — nebo zvolte **Otevřít knihovnu** a vyberte složku s `.md` soubory (včetně OneDrive / iCloud Drive ve Windows).

### Tipy

- **Focus Mode** — celá obrazovka pro psaní; volitelný typewriter.
- **`[[Wiki odkazy]]`** — dvojklik pro otevření; panel zpětných odkazů vpravo.
- **Menu ⋯** u knihovny — import/export najdete pod třemi tečkami vedle stromu souborů.

---

## Folio 1.0.6 — Windows (English)

**Installer:** [Folio_1.0.6_x64-setup.exe](https://github.com/samwe20/Folio/releases/download/folio-1.0.6/Folio_1.0.6_x64-setup.exe)  
**Requirements:** Windows 10 or 11 (WebView2 — usually preinstalled on Windows 11)

### What's new

- **Safer Markdown preview** — stricter HTML sanitization (DOMPurify), risky tags and attributes blocked; unsafe links removed; remote images (`http`/`https`) are off by default with a placeholder in preview — global toggle and per-note override in the preview toolbar.
- **Desktop: library-scoped access** — after you pick a library folder, Folio extends filesystem permissions only to that path (no broad access to all of Documents, Desktop, etc.); generic URL opener removed from default capabilities.
- **Import and export** — zip-slip and oversized-archive guards; file import limited to `.md` extensions; path validation when saving the library to a folder.
- **Library ⋯ menu** — export ZIP, export note, import `.md`, and (where the browser supports it) save to folder live in the sidebar overflow menu by the file tree instead of a long button row.
- **Project site** — trilingual landing page (Czech, English, German) on GitHub Pages for downloads and overview.
- **Update notice (Windows)** — the desktop app checks GitHub Releases at most once per 24 hours; when a newer version exists, a calm bar offers a download link (no auto-install, no telemetry).

### Install

1. Download `Folio_1.0.6_x64-setup.exe` from the link above (or the [release page](https://github.com/samwe20/Folio/releases/tag/folio-1.0.6)).
2. Run the standalone NSIS installer.
3. On first launch Folio uses `Documents/Folio/Library` by default — or use **Open library** to pick any folder of `.md` files (including OneDrive / iCloud Drive on Windows).

### Tips

- **Focus Mode** — fullscreen writing; optional typewriter scrolling.
- **`[[Wiki links]]`** — double-click to open; backlinks panel on the right.
- **Library ⋯ menu** — import/export is under the three-dot control next to the file tree.
