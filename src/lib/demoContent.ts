import type { UiLocale } from "./i18n";

export interface DemoNote {
  fileName: string;
  content: string;
}

export function demoNotes(locale: UiLocale): DemoNote[] {
  if (locale === "en") {
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

  return [
    {
      fileName: "Vítejte ve Folio.md",
      content: `---
title: Vítejte ve Folio
---

# Vítejte ve Folio

Folio je soustředěný markdown editor inspirovaný **iA Writer** — s propojenými poznámkami jako v Obsidianu.

## Začněte tady

1. Pište v čistém markdownu
2. Zapněte **Focus** a nechte zbytek textu ustoupit
3. Propojte myšlenky přes wikilinky

Zkuste otevřít [[Jak psát wikilinky]] nebo [[Focus Mode]].

> Tip: stiskněte \`Ctrl+P\` pro rychlé otevření poznámky.
`,
    },
    {
      fileName: "Jak psát wikilinky.md",
      content: `# Jak psát wikilinky

Odkazy mezi poznámkami píšete stejně jako v Obsidianu:

\`\`\`
[[Název poznámky]]
[[Název poznámky|zobrazený text]]
\`\`\`

## Co Folio umí

- autocomplete po napsání \`[[\`
- dvojklikem otevřete existující poznámku
- pokud cíl neexistuje, Folio ho nabídne vytvořit
- panel **Backlinky** ukáže, kdo odkazuje sem

Související: [[Vítejte ve Folio]], [[Backlinky]].
`,
    },
    {
      fileName: "Focus Mode.md",
      content: `# Focus Mode

Focus Mode spustí immersivní psaní:
- zachová vaše nastavení Typewriteru
- přepne okno do fullscreen
- skryje sidebar, toolbar i status bar
- nechá jen text a tlačítko **Opustit Focus**
- zesvětlí okolní věty (jako iA Writer)

Zapnete ho tlačítkem **Focus** nebo zkratkou \`Ctrl+D\`. Odejdete přes Esc / **Opustit Focus**.

Další tipy najdete v [[Vítejte ve Folio]].
`,
    },
    {
      fileName: "Backlinky.md",
      content: `# Backlinky

Backlink je zpětný odkaz: když poznámka A obsahuje odkaz na tuto stránku, Folio ho sem vypíše automaticky.

Folio indexuje celou knihovnu a panel vpravo živě aktualizuje:

- **Backlinky** — kdo odkazuje na aktuální poznámku
- **Odchozí odkazy** — kam odkazujete vy

Tato poznámka je odkazovaná z [[Jak psát wikilinky]].
`,
    },
  ];
}
