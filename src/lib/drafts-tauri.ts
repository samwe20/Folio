import { exists, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import {
  JOURNAL_FILE,
  MAX_DRAFT_BYTES,
  MAX_DRAFTS_TOTAL_BYTES,
  draftByteLength,
} from "./draftsLimits";

type JournalMap = Record<string, string>;

let journalPath: string | null = null;
let cache: JournalMap | null = null;

async function journalFile(): Promise<string> {
  if (!journalPath) {
    const root = await appLocalDataDir();
    journalPath = await join(root, JOURNAL_FILE);
  }
  return journalPath;
}

async function loadJournal(): Promise<JournalMap> {
  if (cache) return cache;
  const file = await journalFile();
  if (!(await exists(file))) {
    cache = {};
    return cache;
  }
  try {
    cache = JSON.parse(await readTextFile(file)) as JournalMap;
  } catch {
    cache = {};
  }
  return cache;
}

function journalBytes(map: JournalMap): number {
  return Object.values(map).reduce((sum, text) => sum + draftByteLength(text), 0);
}

function trimJournal(map: JournalMap, path: string, nextBytes: number): void {
  let total = journalBytes(map) - draftByteLength(map[path] ?? "") + nextBytes;
  const keys = Object.keys(map).filter((p) => p !== path);
  for (const key of keys) {
    if (total <= MAX_DRAFTS_TOTAL_BYTES) break;
    total -= draftByteLength(map[key] ?? "");
    delete map[key];
  }
}

async function persistJournal(map: JournalMap): Promise<void> {
  cache = map;
  const file = await journalFile();
  await writeTextFile(file, JSON.stringify(map));
}

export async function readDraftTauri(path: string): Promise<string | null> {
  const map = await loadJournal();
  return map[path] ?? null;
}

export async function rememberDraftTauri(path: string, text: string): Promise<boolean> {
  const bytes = draftByteLength(text);
  if (bytes > MAX_DRAFT_BYTES) return false;
  const map = { ...(await loadJournal()) };
  trimJournal(map, path, bytes);
  const total = journalBytes(map) - draftByteLength(map[path] ?? "") + bytes;
  if (total > MAX_DRAFTS_TOTAL_BYTES) return false;
  map[path] = text;
  try {
    await persistJournal(map);
    return true;
  } catch {
    return false;
  }
}

export async function forgetDraftTauri(path: string, savedText?: string): Promise<void> {
  const map = await loadJournal();
  if (!(path in map)) return;
  if (savedText !== undefined && map[path] !== savedText) return;
  delete map[path];
  try {
    if (Object.keys(map).length) await persistJournal(map);
    else {
      cache = {};
      const file = await journalFile();
      if (await exists(file)) await remove(file);
    }
  } catch {
    /* ignore */
  }
}

function enforceTotalLimit(map: JournalMap): void {
  let keys = Object.keys(map);
  while (journalBytes(map) > MAX_DRAFTS_TOTAL_BYTES && keys.length) {
    delete map[keys.pop()!];
  }
}

export async function importTauriJournal(entries: { path: string; text: string }[]): Promise<void> {
  if (!entries.length) return;
  const map = await loadJournal();
  for (const { path, text } of entries) {
    if (draftByteLength(text) > MAX_DRAFT_BYTES) continue;
    map[path] = text;
  }
  enforceTotalLimit(map);
  await persistJournal(map);
}
