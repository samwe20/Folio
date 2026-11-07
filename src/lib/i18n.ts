export type UiLocale = "cs" | "en";

type MessageKey = keyof typeof cs;

const cs = {
  "sidebar.files": "Soubory",
  "action.newNote": "Nová poznámka",
  "action.openLibrary": "Otevřít knihovnu",
  "action.refreshLibrary": "Obnovit knihovnu",
  "action.close": "Zavřít",
  "action.closeLibrary": "Zavřít knihovnu",
  "action.closeBacklinks": "Zavřít backlinky",
  "disk.saveFolder": "Uložit do složky",
  "library.none": "Žádná knihovna",
  "library.browserLabel": "Prohlížeč · Folio Library",
  "sort.group": "Řazení souborů",
  "sort.byLabel": "Řadit podle",
  "sort.byName": "Názvu",
  "sort.byCreated": "Data vytvoření",
  "sort.directionLabel": "Směr řazení",
  "sort.asc": "Vzestupně ↑",
  "sort.desc": "Sestupně ↓",
  "toolbar.library": "Knihovna",
  "title.untitled": "Bez názvu",
  "font.label": "Font",
  "font.editor": "Font editoru",
  "chip.focus": "Focus",
  "chip.focusTitle": "Focus Mode — celá obrazovka bez rušivých prvků",
  "chip.typewriter": "Typewriter",
  "chip.preview": "Preview",
  "chip.previewTitle": "Náhled",
  "chip.themeDark": "Dark",
  "chip.themeLight": "Light",
  "chip.themeToggle": "Přepnout motiv",
  "chip.links": "Links",
  "chip.linksTitle": "Backlinky",
  "chip.localeToEn": "English",
  "chip.localeToCs": "Čeština",
  "preview.aria": "Náhled poznámky",
  "preview.remoteBlocked": "Vzdálený obrázek zablokován",
  "preview.remoteGlobalOn": "Vzdálené obrázky: zap",
  "preview.remoteGlobalOff": "Vzdálené obrázky: vyp",
  "preview.remoteGlobalTitle": "Povolit nebo zakázat načítání http(s) obrázků ve všech poznámkách",
  "preview.remoteNoteOn": "Tato poznámka: obrázky zap",
  "preview.remoteNoteOff": "Tato poznámka: obrázky vyp",
  "preview.remoteNoteTitle": "Přepsat nastavení pro aktuální poznámku",
  "backlinks.title": "Backlinky",
  "backlinks.hint": "Poznámky, které odkazují sem přes [[…]].",
  "outgoing.title": "Odchozí odkazy",
  "status.ready": "Připraveno",
  "status.saved": "Uloženo",
  "status.autosaved": "Automaticky uloženo",
  "status.unsaved": "Neuloženo…",
  "status.unsavedNoJournal": "Neuloženo — obnova konceptu není dostupná",
  "status.draftRecovering": "Obnoven rozepsaný text — ukládám…",
  "status.exporting": "Exportuji…",
  "status.exportShared": "Export připraven (Sdílet → Uložit do Souborů)",
  "status.exportDownloaded": "ZIP stažen na disk",
  "status.exportCancelled": "Export zrušen",
  "status.exportFailed": "Export selhal",
  "status.importOne": "Importován 1 soubor",
  "status.importMany": "Importováno {count} souborů",
  "status.importFailed": "Import selhal",
  "status.savedManyToFolder": "Uloženo {count} souborů do složky",
  "status.saveFolderCancelled": "Ukládání zrušeno",
  "status.saveFolderFailed": "Uložení do složky selhalo",
  "status.noteShared": "Poznámka připravena ke sdílení",
  "status.noteDownloaded": "Poznámka stažena",
  "status.renameFailed": "Přejmenování selhalo",
  "status.saveFailedDirty": "Uložení selhalo — text zůstává v editoru. Zkuste Ctrl/Cmd+S.",
  "status.operationFailed": "Operace selhala. Zkuste ji znovu.",
  "status.hintDesktop": "[[odkaz]] bez závorek · dvojklik otevře · Ctrl+N nová · Ctrl+P otevření",
  "empty.notes": "Zatím žádné poznámky",
  "empty.backlinks": "Zatím žádné backlinky",
  "empty.outgoing": "Žádné odchozí [[odkazy]]",
  "links.missing": "{title} (chybí)",
  "confirm.delete": "Smazat „{title}“?",
  "confirm.createWiki": "Poznámka „{title}“ neexistuje. Vytvořit?",
  "dialog.pickLibrary": "Vyberte složku knihovny Folio",
  "focus.exit": "Opustit Focus",
  "focus.exitTitle": "Opustit Focus (Esc)",
  "focus.exitAria": "Opustit Focus Mode",
  "command.aria": "Otevřít poznámku",
  "command.inputAria": "Vyhledat poznámku",
  "command.placeholder": "Otevřít poznámku…",
  "welcome.tagline":
    "Soustředěné psaní ve stylu iA Writer — s propojenými poznámkami jako v Obsidianu.",
  "welcome.taglineWeb":
    "Folio v prohlížeči — soustředěné psaní s [[wikilinky]]. Na iPhonu: Sdílet → Přidat na plochu.",
  "welcome.taglineMobile":
    "Soustředěné psaní na iPhonu — s [[propojenými]] poznámkami. Knihovna žije přímo v aplikaci.",
  "welcome.demo": "Začít s ukázkovou knihovnou",
  "welcome.demoWeb": "Otevřít knihovnu",
  "welcome.openFolder": "Otevřít jinou složku",
  "editor.placeholder": "Začněte psát…  [[odkaz]] propojí poznámky",
  "startup.failed":
    "Knihovnu se nepodařilo otevřít. Zkuste obnovit stránku nebo vybrat složku znovu.",
  "defaultNoteTitle": "Bez názvu",
} as const;

const en: Record<MessageKey, string> = {
  "sidebar.files": "Files",
  "action.newNote": "New note",
  "action.openLibrary": "Open library",
  "action.refreshLibrary": "Refresh library",
  "action.close": "Close",
  "action.closeLibrary": "Close library",
  "action.closeBacklinks": "Close links panel",
  "disk.saveFolder": "Save to folder",
  "library.none": "No library",
  "library.browserLabel": "Browser · Folio Library",
  "sort.group": "Sort files",
  "sort.byLabel": "Sort by",
  "sort.byName": "Name",
  "sort.byCreated": "Date created",
  "sort.directionLabel": "Sort direction",
  "sort.asc": "Ascending ↑",
  "sort.desc": "Descending ↓",
  "toolbar.library": "Library",
  "title.untitled": "Untitled",
  "font.label": "Font",
  "font.editor": "Editor font",
  "chip.focus": "Focus",
  "chip.focusTitle": "Focus Mode — fullscreen, minimal chrome",
  "chip.typewriter": "Typewriter",
  "chip.preview": "Preview",
  "chip.previewTitle": "Preview",
  "chip.themeDark": "Dark",
  "chip.themeLight": "Light",
  "chip.themeToggle": "Toggle theme",
  "chip.links": "Links",
  "chip.linksTitle": "Backlinks",
  "chip.localeToEn": "English",
  "chip.localeToCs": "Čeština",
  "preview.aria": "Note preview",
  "preview.remoteBlocked": "Remote image blocked",
  "preview.remoteGlobalOn": "Remote images: on",
  "preview.remoteGlobalOff": "Remote images: off",
  "preview.remoteGlobalTitle": "Allow or block http(s) images in preview for all notes",
  "preview.remoteNoteOn": "This note: images on",
  "preview.remoteNoteOff": "This note: images off",
  "preview.remoteNoteTitle": "Override remote images for the current note",
  "backlinks.title": "Backlinks",
  "backlinks.hint": "Notes that link here via [[…]].",
  "outgoing.title": "Outgoing links",
  "status.ready": "Ready",
  "status.saved": "Saved",
  "status.autosaved": "Saved automatically",
  "status.unsaved": "Unsaved…",
  "status.unsavedNoJournal": "Unsaved — draft recovery unavailable",
  "status.draftRecovering": "Restored draft — saving…",
  "status.exporting": "Exporting…",
  "status.exportShared": "Export ready (Share → Save to Files)",
  "status.exportDownloaded": "ZIP downloaded",
  "status.exportCancelled": "Export cancelled",
  "status.exportFailed": "Export failed",
  "status.importOne": "Imported 1 file",
  "status.importMany": "Imported {count} files",
  "status.importFailed": "Import failed",
  "status.savedManyToFolder": "Saved {count} files to folder",
  "status.saveFolderCancelled": "Save cancelled",
  "status.saveFolderFailed": "Save to folder failed",
  "status.noteShared": "Note ready to share",
  "status.noteDownloaded": "Note downloaded",
  "status.renameFailed": "Rename failed",
  "status.saveFailedDirty": "Save failed — your text stays in the editor. Try Ctrl/Cmd+S.",
  "status.operationFailed": "Operation failed. Try again.",
  "status.hintDesktop": "[[link]] without brackets · double-click opens · Ctrl+N new · Ctrl+P open",
  "empty.notes": "No notes yet",
  "empty.backlinks": "No backlinks yet",
  "empty.outgoing": "No outgoing [[links]]",
  "links.missing": "{title} (missing)",
  "confirm.delete": "Delete “{title}”?",
  "confirm.createWiki": "Note “{title}” does not exist. Create it?",
  "dialog.pickLibrary": "Choose Folio library folder",
  "focus.exit": "Exit Focus",
  "focus.exitTitle": "Exit Focus (Esc)",
  "focus.exitAria": "Exit Focus Mode",
  "command.aria": "Open note",
  "command.inputAria": "Search notes",
  "command.placeholder": "Open note…",
  "welcome.tagline":
    "Distraction-free writing like iA Writer — with Obsidian-style linked notes.",
  "welcome.taglineWeb":
    "Folio in the browser — focused writing with [[wiki links]]. On iPhone: Share → Add to Home Screen.",
  "welcome.taglineMobile":
    "Focused writing on iPhone — with [[linked]] notes. Library lives inside the app.",
  "welcome.demo": "Start with sample library",
  "welcome.demoWeb": "Open library",
  "welcome.openFolder": "Open another folder",
  "editor.placeholder": "Start writing…  [[link]] connects notes",
  "startup.failed": "Could not open the library. Refresh the page or pick a folder again.",
  "defaultNoteTitle": "Untitled",
};

const catalogs: Record<UiLocale, Record<MessageKey, string>> = { cs, en };

let current: UiLocale = "cs";

export function setUiLocale(locale: UiLocale) {
  current = locale;
  document.documentElement.lang = locale;
}

export function getUiLocale(): UiLocale {
  return current;
}

export function sortLocaleTag(locale: UiLocale): string {
  return locale === "en" ? "en" : "cs";
}

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  let text: string = catalogs[current][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function formatWordCount(words: number): string {
  if (current === "en") {
    return `${words} ${words === 1 ? "word" : "words"}`;
  }
  const label = words === 1 ? "slovo" : words > 1 && words < 5 ? "slova" : "slov";
  return `${words} ${label}`;
}

export function formatCharCount(chars: number): string {
  return current === "en" ? `${chars} characters` : `${chars} znaků`;
}

export function defaultNoteTitle(): string {
  return t("defaultNoteTitle");
}

/** Apply `data-i18n`, `data-i18n-title`, `data-i18n-placeholder`, `data-i18n-aria-label` on static markup. */
export function applyStaticUi(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as MessageKey;
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle as MessageKey;
    if (key) el.title = t(key);
  });
  root.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder as MessageKey;
    if (key) el.placeholder = t(key);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((el) => {
    const key = el.dataset.i18nAriaLabel as MessageKey;
    if (key) el.setAttribute("aria-label", t(key));
  });
  root.querySelectorAll<HTMLOptionElement>("option[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as MessageKey;
    if (key) el.textContent = t(key);
  });
}
