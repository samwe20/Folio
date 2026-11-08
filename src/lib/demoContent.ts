import type { UiLocale } from "./i18n";

/** Post-install sample library is always English (UI locale may still be Czech). */
export const TUTORIAL_LOCALE: UiLocale = "en";

export interface DemoNote {
  fileName: string;
  content: string;
}

export function tutorialNotes(): DemoNote[] {
  return [
    {
      fileName: "Welcome to Folio.md",
      content: `---
title: Welcome to Folio
---

# Welcome to Folio

Folio combines **iA Writer** calm with **Obsidian-style** \`[[wiki links]]\`.

## Start here

1. Write in plain Markdown
2. Turn on **Focus** to hide chrome
3. Link ideas with wiki links

Try [[How wiki links work]] or [[Focus Mode]].

> Tip: press \`Ctrl+P\` to quick-open a note.
`,
    },
    {
      fileName: "How wiki links work.md",
      content: `# How wiki links work

Link notes like in Obsidian:

\`\`\`
[[Note title]]
[[Note title|display text]]
\`\`\`

## What Folio does

- autocomplete after \`[[\`
- double-click to open (desktop)
- long-press on mobile
- **Links** panel shows backlinks

See also: [[Welcome to Folio]], [[Backlinks]].
`,
    },
    {
      fileName: "Focus Mode.md",
      content: `# Focus Mode

Focus Mode is immersive writing:
- keeps your Typewriter preference
- fullscreen on desktop
- hides sidebars and toolbars
- dims surrounding lines (iA Writer style)

Use **Focus** or \`Ctrl+D\`. Leave with Esc / **Exit Focus**.

More in [[Welcome to Folio]].
`,
    },
    {
      fileName: "Backlinks.md",
      content: `# Backlinks

When another note links here via \`[[Backlinks]]\`, Folio lists it automatically.

The right panel shows:

- **Backlinks** — who links here
- **Outgoing links** — where you link out

This note is linked from [[How wiki links work]].
`,
    },
  ];
}

/** @deprecated Use tutorialNotes(); sample library is English-only. */
export function demoNotes(_locale: UiLocale): DemoNote[] {
  return tutorialNotes();
}
