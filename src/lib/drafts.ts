import { isTauri } from "./runtime";
import { clearLegacyWebDraftKeys, forgetDraftWeb, purgeLegacyWebDraftKeys, readDraftWeb, rememberDraftWeb } from "./drafts-web";

let migrationDone = false;

async function tauriDrafts() {
  return import("./drafts-tauri.ts");
}

/** One-time migration of browser localStorage journals into Tauri app data (desktop only). */
export async function migrateLegacyDrafts(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;
  if (!isTauri()) return;
  const migrated = clearLegacyWebDraftKeys();
  if (!migrated.length) return;
  const tauri = await tauriDrafts();
  await tauri.importTauriJournal(migrated);
  purgeLegacyWebDraftKeys();
}

export async function rememberDraft(path: string, text: string): Promise<boolean> {
  if (isTauri()) return (await tauriDrafts()).rememberDraftTauri(path, text);
  return rememberDraftWeb(path, text);
}

export async function readDraft(path: string): Promise<string | null> {
  if (isTauri()) return (await tauriDrafts()).readDraftTauri(path);
  return readDraftWeb(path);
}

/** Drop a journal entry. Omit `savedText` to remove unconditionally (e.g. after a confirmed save). */
export async function forgetDraft(path: string, savedText?: string): Promise<void> {
  if (isTauri()) return (await tauriDrafts()).forgetDraftTauri(path, savedText);
  forgetDraftWeb(path, savedText);
}
