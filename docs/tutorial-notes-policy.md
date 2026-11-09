# Tutorial notes in the user library

Folio ships English starter notes (`Welcome to Folio.md`, etc.) when the user picks the sample library or when we migrate the old Czech-only starter set.

**Policy**

- Template text lives in `src/lib/demoContent.ts` — used only when **seeding** or **migrating**, not on every app start.
- After files exist on disk, they are ordinary user notes: Folio must **not** rewrite or “clean” them because of test edits, dropped images, or accidental changes.
- To get a fresh template set again, the user can use a new demo library folder or delete/re-seed manually.
