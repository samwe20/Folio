import type { NoteMeta } from "../types";
import { tutorialNotes } from "./demoContent";

/** Files shipped with the old Czech first-run sample library. */
export const LEGACY_CZECH_STARTER_FILES = [
  "Vítejte ve Folio.md",
  "Jak psát wikilinky.md",
  "Focus Mode.md",
  "Backlinky.md",
] as const;

export function noteBaseName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] ?? path;
}

/** True when the library is only the deprecated Czech starter set (no user notes). */
export function isLegacyCzechTutorialOnly(notes: NoteMeta[]): boolean {
  if (!notes.length) return false;
  const names = notes.map((n) => noteBaseName(n.path));
  if (names.includes("Welcome to Folio.md")) return false;
  if (!names.includes("Vítejte ve Folio.md")) return false;
  const allowed = new Set<string>(LEGACY_CZECH_STARTER_FILES);
  return names.every((name) => allowed.has(name));
}

export type TutorialSeedDeps = {
  libraryPath: string;
  join: (base: string, file: string) => Promise<string>;
  writeNote: (path: string, content: string) => Promise<void>;
  deleteNote: (path: string) => Promise<void>;
};

export async function seedEnglishTutorialLibrary(deps: TutorialSeedDeps): Promise<string> {
  const notes = tutorialNotes();
  for (const note of notes) {
    await deps.writeNote(await deps.join(deps.libraryPath, note.fileName), note.content);
  }
  return await deps.join(deps.libraryPath, notes[0].fileName);
}

export async function replaceLegacyCzechTutorial(
  existing: NoteMeta[],
  deps: TutorialSeedDeps,
): Promise<string> {
  for (const note of existing) {
    const name = noteBaseName(note.path);
    if ((LEGACY_CZECH_STARTER_FILES as readonly string[]).includes(name)) {
      await deps.deleteNote(note.path);
    }
  }
  return seedEnglishTutorialLibrary(deps);
}
