# Web a PWA (iPhone / prohlížeč)

Webová verze Folia funguje v **Safari na iPhonu** bez Macu a bez App Store — přidej si ji na plochu jako PWA.

## Rychlý start

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio
npm ci
npm run web:dev
```

Produkční build:

```bash
npm run web:build
npm run web:preview
```

## Přidat na plochu iPhonu

1. Otevři Folio v **Safari**
2. **Sdílet** → **Přidat na plochu**
3. Spouštěj z ikony Folio

## Co běží v prohlížeči

- Poznámky v **IndexedDB** (zůstávají v zařízení)
- `[[wikilinky]]` a backlinky
- Mobilní drawer knihovny a panel odkazů
- Offline shell přes service worker
- **Export ZIP** / **Import .md** v levém panelu

## Poznámky ↔ Soubory (iPhone)

Safari neumí tiše zapisovat do složky Soubory. Doporučený postup:

1. Otevři knihovnu (☰)
2. **Export ZIP** nebo **Export .md**
3. V share sheetu **Uložit do Souborů** (iCloud Drive, …)

Zpět: **Import .md** načte soubory ze Souborů.

Na desktop Chrome/Edge je navíc **Uložit do složky** (File System Access API).

## Ovládání

- Otevření wiki odkazu: **dlouhý stisk** (mobil)
- Knihovna a odkazy: spodní lišta / drawer

## Offline a aktualizace

- Pro PWA na iPhonu je potřeba **HTTPS** (localhost na vývoj stačí)
- Použij `npm run web:build` — service worker se na dev serveru neregistruje
- Nová verze se aktivuje po **zavření všech karet** Folia
- Import stejnojmenného souboru vytvoří kopii s číselným suffixem

## Oddělení od Windows

Knihovna v prohlížeči a knihovna v desktopové aplikaci jsou **oddělené**. Mezi nimi přenášej exportem/importem `.md` nebo ZIP.
