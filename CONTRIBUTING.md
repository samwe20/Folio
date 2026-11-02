# Přispívání do Folio

Děkujeme za zájem o Folio.

1. Pro bug nebo nápad otevři [issue](https://github.com/samwe20/Folio/issues).
2. Fork → větev → změna → pull request na `main`.
3. Před odesláním spusť:

```bash
npm ci
npm run check
npm test
```

Pro větší změny UI nejdřív issue — vzhled Folio je záměrně ustálený (typografie, světlý/tmavý režim).

Viz [docs/development.md](docs/development.md) pro CI a strukturu projektu.
