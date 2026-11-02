# Reliability & data behavior

## Library sorting

**Sort by** — title (Czech alphabet, natural number order) or creation date, ascending or descending. The choice survives restart.

On native files, Folio stores creation dates in app metadata (atomic rewrites do not reliably preserve filesystem birth time). Older web notes without a date, or files without birth time, sort to the end.

## Saving

- Undo is **scoped to the loaded note**; theme changes and index refresh do not wipe history
- Saves are serialized; navigation waits for edits to finish
- **Recovery journal** restores text interrupted before autosave (not a backup or version history)
- Native writes: temp file in the same folder → `rename`
- Browser: IndexedDB transaction completes before “saved” is shown
- Duplicate import names → numbered copy; ZIP export keeps subfolders

## Markdown preview

Preview runs through **DOMPurify** — executable HTML and dangerous links are stripped. Wiki examples inside code blocks stay literal.

## Offline (PWA)

Production builds precache JS, CSS, and fonts, including when hosted under a subpath. Activate a new version by closing all Folio tabs.

## Out of scope (by design)

- **Cloud sync** — the library is files; use OneDrive/iCloud if you put the folder there
- **Rewriting wiki links** when renaming a note — not yet
- **Concurrent editing** of the same file from multiple apps — avoid; last write wins

Desktop and web libraries stay separate unless you move notes via export/import.
