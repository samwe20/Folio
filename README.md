<div align="center">

# Folio

**Soustředěné psaní v Markdownu** — typografie jako v iA Writer, propojené poznámky jako v Obsidianu.

[![Verze](https://img.shields.io/github/v/release/samwe20/Folio?display_name=tag&filter=folio-*&label=verze&color=f3efe4&logoColor=1a1a1a)](https://github.com/samwe20/Folio/releases/latest)
[![Windows CI](https://github.com/samwe20/Folio/actions/workflows/folio.yml/badge.svg?branch=main)](https://github.com/samwe20/Folio/actions/workflows/folio.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Tauri%202%20%C2%B7%20Vite%20%C2%B7%20TypeScript-333)](docs/development.md)

[Stáhnout pro Windows](#stáhnout) · [Rychlý start](#rychlý-start) · [Dokumentace](#dokumentace) · [Náhled](#náhled)

</div>

<video src="docs/assets/folio-demo.mp4" controls width="100%" muted loop playsinline>
  <a href="docs/assets/folio-demo.mp4">Stáhnout demo video</a>
</video>

---

## Náhled

<table>
  <tr>
    <td width="50%">
      <img src="docs/assets/folio-light-library.png" alt="Folio — světlý režim, strom knihovny" />
      <br /><sub>Světlý režim · úzký strom souborů</sub>
    </td>
    <td width="50%">
      <img src="docs/assets/folio-dark-library.png" alt="Folio — tmavý režim" />
      <br /><sub>Tmavý režim · plocha #000000, panel #070707</sub>
    </td>
  </tr>
  <tr>
    <td>
      <img src="docs/assets/folio-focus-mode.png" alt="Focus Mode" />
      <br /><sub>Focus Mode · celá obrazovka, typewriter</sub>
    </td>
    <td>
      <img src="docs/assets/folio-preview.png" alt="Náhled Markdownu a backlinky" />
      <br /><sub>Náhled · sanitizovaný HTML, wiki odkazy</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <img src="docs/assets/folio-mobile-library.png" alt="Folio na iPhonu — knihovna" width="360" />
      <br /><sub>PWA v Safari · mobilní drawer, české UI</sub>
    </td>
  </tr>
</table>


---

## Proč Folio

| | |
|---|---|
| ✍️ **Psaní bez rušení** | Typografie na prvním místě, Focus Mode, volitelný typewriter |
| 🔗 **[[Wikilinky]]** | Autocomplete, dvojklik (desktop), dlouhý stisk (mobil) |
| ↩️ **Backlinky** | Živý panel zpětných a odchozích odkazů |
| 📁 **Tvoje data** | Knihovna = složka `.md` na disku (Windows); export/import pro web |
| 🌓 **Světlý / tmavý** | Teplý papír ve světle, téměř černá v tmavém režimu |
| 🇨🇿 **UI česky** | Řazení podle české abecedy, české popisky |

Technicky: **Tauri 2** (Windows, NSIS + WebView2), **Vite + CodeMirror 6**, náhled přes **DOMPurify**, offline **PWA** pro iPhone.

---

## Stáhnout

| Platforma | Jak |
|-----------|-----|
| **Windows 10/11** | [Nejnovější release](https://github.com/samwe20/Folio/releases/latest) → `Folio_*_x64-setup.exe` (samostatný instalátor) |
| **iPhone (bez Macu)** | Web / PWA — [návod](docs/web-pwa.md) |
| **iOS nativní** | Mac + Xcode — [návod](docs/ios-native.md) |

---

## Rychlý start

```bash
git clone https://github.com/samwe20/Folio.git
cd Folio
npm ci
npm run desktop:dev    # Windows desktop
# npm run web:dev      # prohlížeč / vývoj PWA
```

Podrobnosti: [Windows](docs/windows.md) · [Web / PWA](docs/web-pwa.md)

---

## Dokumentace

| Dokument | Obsah |
|----------|--------|
| [docs/windows.md](docs/windows.md) | Instalace, vývoj, zkratky, knihovna |
| [docs/web-pwa.md](docs/web-pwa.md) | iPhone, offline, export/import |
| [docs/ios-native.md](docs/ios-native.md) | Tauri iOS na Macu |
| [docs/development.md](docs/development.md) | Testy, CI, struktura repa |
| [docs/reliability.md](docs/reliability.md) | Ukládání, undo, preview, limity |

---

## Přispívání

Issues a pull requesty jsou vítány. Před větší změnou projdi [vývojářskou příručku](docs/development.md) a spusť `npm test` + `npm run check`.

---

## Licence

[MIT](LICENSE) — © 2026 [samwe20](https://github.com/samwe20).
