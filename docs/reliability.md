# Spolehlivost a chování dat

## Řazení knihovny

**Řadit podle** — název (česká abeceda, přirozené číslování) nebo datum vytvoření, vzestupně i sestupně. Volba přežije restart.

U nativních souborů Folio uchovává datum vytvoření v app metadata (atomické přepisy nemění „birth time“ souboru spolehlivě). Staré webové poznámky bez data nebo soubory bez birth time končí na konci řazení.

## Ukládání

- Undo je **izolované na načtenou poznámku**; změna motivu nebo obnova indexu historii nemaže
- Ukládání je serializované; navigace čeká na dokončení editace
- **Recovery journal** obnoví text přerušený před autosave (není to záloha ani historie verzí)
- Nativní zápis: dočasný soubor ve stejné složce → `rename`
- Prohlížeč: IndexedDB transakce před potvrzením „uloženo“
- Import duplicitního jména → kopie s číslem; export ZIP zachová podsložky

## Náhled Markdownu

Preview prochází **DOMPurify** — spustitelné HTML a nebezpečné odkazy se odstraní. Wiki příklady v code blocích zůstávají literální.

## Offline (PWA)

Produkční build precachuje JS, CSS a fonty včetně hostingu pod podsložkou. Novou verzi aktivuj zavřením všech karet Folia.

## Co Folio záměrně neřeší

- **Cloud sync** — knihovna jsou soubory; sync řeší OneDrive/iCloud, pokud složku umístíš tam (viz diskuze v issues)
- **Přepis wikilinků** při přejmenování poznámky — zatím ne
- **Souběžná editace** stejného souboru z více aplikací — vyhni se; poslední zápis vyhrává

Desktopová a webová knihovna zůstávají oddělené, dokud nepřenášíš exportem/importem.
