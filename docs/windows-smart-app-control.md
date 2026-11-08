# Windows: Smart App Control a nepodepsaný instalátor

Folio se na GitHubu distribuuje jako **NSIS instalátor** (`Folio_*_x64-setup.exe`). Stahuješ ho přes HTTPS z [GitHub Releases](https://github.com/samwe20/Folio/releases). Instalátor **zatím není podepsaný** certifikátem Authenticode (viz [windows-code-signing.md](windows-code-signing.md)).

Na **Windows 11** s zapnutým **[Smart App Control](https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/overview)** (SAC) může systém instalátor **úplně zablokovat** — často **bez** tlačítka „Spustit přesto“. Důvod: Microsoft neověřil vydavatele souboru.

To **není** typická chyba Folio ani nutně malware — jde o očekávané chování u nepodepsaných aplikací.

## Rychlá řešení pro uživatele

### 1. Smart App Control (blok „may be unsafe“)

1. **Nastavení** → **Soukromí a zabezpečení** → **Zabezpečení Windows** → **Ovládání aplikací a prohlížeče**
2. **Smart App Control** → otevři nastavení
3. Zvol **Vypnuto**

⚠️ Windows upozorní, že SAC po vypnutí **obvykle nelze znovu zapnout** bez přeinstalace systému. Zapni jen pokud věříš zdroji (oficiální release z `samwe20/Folio` na GitHubu).

Poté znovu spusť stažený `Folio_*_x64-setup.exe`.

### 2. Klasický SmartScreen (ne SAC)

U staršího varování „Neznámý vydavatel“ po stažení z prohlížeče:

- **Další informace** → **Spustit přesto**, nebo
- pravé tlačítko na `.exe` → **Spustit jako správce** (pomáhá jen někdy).

### 3. Ověření, že máš správný soubor

- Stahuj jen z **`https://github.com/samwe20/Folio/releases`**
- Kontrola tagu, např. `folio-1.0.8`
- Volitelně porovnej SHA-256 hashe z release (až budou v poznámkách k vydání — plán v [windows-code-signing.md](windows-code-signing.md))

### 4. Sestavení ze zdrojů (vývojáři)

Důvěřuješ jen vlastnímu buildu:

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio && npm ci && npm run desktop:build -- --bundles nsis
```

Instalátor: `src-tauri/target/release/bundle/nsis/*-setup.exe` (lokálně vytvořený; SAC ho stejně může blokovat, pokud není podepsaný).

---

## English (short)

**Smart App Control** on Windows 11 may block unsigned installers with no “Run anyway” option. Download only from [GitHub Releases](https://github.com/samwe20/Folio/releases). To install today: turn off Smart App Control under **Settings → Privacy & security → Windows Security → App & browser control** (note: turning SAC off is often permanent). Long-term fix for all users is **Authenticode signing** — see [windows-code-signing.md](windows-code-signing.md).
