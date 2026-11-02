# Web & PWA (iPhone / browser)

The web build runs in **Safari on iPhone** without a Mac or the App Store — add it to your home screen as a PWA.

## Quick start

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio
npm ci
npm run web:dev
```

Production build:

```bash
npm run web:build
npm run web:preview
```

## Add to iPhone home screen

1. Open Folio in **Safari**
2. **Share** → **Add to Home Screen**
3. Launch from the Folio icon

## In the browser

- Notes in **IndexedDB** (stay on device)
- `[[wiki links]]` and backlinks
- Mobile library drawer and links sheet
- Offline shell via service worker
- **Export ZIP** / **Import .md** in the sidebar

## Notes ↔ Files (iPhone)

Safari cannot silently write to the Files app. Recommended flow:

1. Open the library (☰)
2. **Export ZIP** or **Export .md**
3. In the share sheet, **Save to Files** (iCloud Drive, …)

Back: **Import .md** loads files from Files.

On desktop Chrome/Edge you also get **Save to folder** (File System Access API).

## Controls

- Open a wiki link: **long-press** (mobile)
- Library and links: bottom bar / drawer

## Offline & updates

- iPhone PWA needs **HTTPS** (localhost is fine for development)
- Use `npm run web:build` — the dev server does not register a service worker
- A new version applies after you **close all Folio tabs**
- Importing the same filename creates a numbered copy

## Separate from Windows

The browser library and the desktop app library are **independent**. Move notes with export/import (`.md` or ZIP).
