## Folio 1.0.8 — Windows

**Instalátor:** [Folio_1.0.8_x64-setup.exe](https://github.com/samwe20/Folio/releases/download/folio-1.0.8/Folio_1.0.8_x64-setup.exe)  
**Požadavky:** Windows 10 nebo 11 (WebView2 — na Windows 11 obvykle už nainstalovaný)

### Co je nového oproti 1.0.7

- **Obrázky (Windows)** — spolehlivější přetažení z Průzkumníka (prázdné MIME, cesty `file://`); po uložení do `assets/` se opraví rozbitý text v poznámce (`![](assets/…)` místo samotného čísla).
- **Ukázkový tutoriál** — demo knihovna je anglicky; stará čistě česká startovní sada se při otevření nahradí anglickou (pokud jste nepřidali vlastní poznámky).
- **Aktualizace** — po ruční kontrole ☰ → *Zkontrolovat aktualizace* dostanete srozumitelnou hlášku, že nová verze není (CS/EN podle jazyka aplikace).

### Instalace

1. Stáhněte `Folio_1.0.8_x64-setup.exe` z odkazu výše (nebo ze [stránky release](https://github.com/samwe20/Folio/releases/tag/folio-1.0.8)).
2. Spusťte instalátor (samostatný NSIS setup, ne zip).
3. Knihovna zůstává v `Dokumenty/Folio/Library`, pokud ji už máte — instalace jen aktualizuje aplikaci.

**Windows 11 blokuje instalaci?** [windows-smart-app-control.md](https://github.com/samwe20/Folio/blob/main/docs/windows-smart-app-control.md)

---

## Folio 1.0.8 — Windows (English)

**Installer:** [Folio_1.0.8_x64-setup.exe](https://github.com/samwe20/Folio/releases/download/folio-1.0.8/Folio_1.0.8_x64-setup.exe)  
**Requirements:** Windows 10 or 11 (WebView2 — usually preinstalled on Windows 11)

### What's new since 1.0.7

- **Images (Windows)** — more reliable drag-and-drop from Explorer (`file://`, empty MIME); fixes broken in-note markdown after the file lands in `assets/`.
- **Sample tutorial** — English demo library; the old Czech-only starter set is replaced on open (unchanged if you added your own notes).
- **Updates** — manual check (☰ → *Check for updates*) shows a clear localized *No update available* message.

### Install

1. Download `Folio_1.0.8_x64-setup.exe` from the link above (or the [release page](https://github.com/samwe20/Folio/releases/tag/folio-1.0.8)).
2. Run the standalone NSIS installer.
3. Your existing library under `Documents/Folio/Library` is kept — this updates the app only.

**Installer blocked on Windows 11?** See [windows-smart-app-control.md](https://github.com/samwe20/Folio/blob/main/docs/windows-smart-app-control.md).
