# Bezpečnost Folio

Děkujeme za odpovědné nahlášení zranitelností. Folio je místní editor Markdownu — bezpečnost uživatelů a jejich knihoven poznámek je prioritou.

## Co nahlásit

- XSS nebo spuštění skriptu v náhledu nebo v UI
- Neoprávněný přístup k souborům mimo zvolenou knihovnu (desktop)
- Únik obsahu poznámek přes síť bez vědomí uživatele
- Zip-slip, path traversal nebo jiné problémy importu/exportu
- Problémy v závislostech nebo v dodavatelském řetězci s reálným dopadem na uživatele

Běžné chyby aplikace (UI, ukládání, překlady) patří do [šablony bug reportu](.github/ISSUE_TEMPLATE/bug_report.yml).

## Jak nahlásit zranitelnost

1. **Neveřejně** napište maintainerovi [samwe20](https://github.com/samwe20) (GitHub zpráva nebo e-mail uvedený v profilu).
2. Pokud je pro repo zapnuté **GitHub Security Advisories**, můžete použít [Private vulnerability reporting](https://github.com/samwe20/Folio/security/advisories).
3. Do zprávy uveďte: popis, kroky k reprodukci, dopad, verzi Folio a případný PoC (minimalizovaný).

**Prosím nezakládejte veřejné issue** s exploitem, dokud není k dispozici oprava.

## Co očekávat

- Potvrzení přijetí do **7 dnů** (pokud je to možné).
- Oznámení opravy a koordinované zveřejnění po nápravě.
- Uvedení v changelogu / security auditu, pokud to situace vyžaduje.

## Bezpečnostní model (stručně)

- Náhled poznámek prochází **Marked** + **DOMPurify** s dodatečnými pravidly (viz `src/lib/preview.ts`, `src/lib/safeUrl.ts`).
- Desktop (Tauri 2) používá capability allowlist a **persisted scope** po výběru složky knihovny.
- PWA ukládá poznámky v **IndexedDB** v rámci stejného origine; servisní worker precachuje pouze build aplikace.

Podrobný audit: [`docs/security-audit.md`](docs/security-audit.md).

## Poděkování

Bezpečnostním výzkumníkům, kteří pomohou Folio zlepšit zodpovědným sdělením, děkujeme.
