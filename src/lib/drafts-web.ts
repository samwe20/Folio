import {
  DRAFT_STORAGE_PREFIX,
  MAX_DRAFT_BYTES,
  MAX_DRAFTS_TOTAL_BYTES,
  draftByteLength,
} from "./draftsLimits";

function journalKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(DRAFT_STORAGE_PREFIX)) keys.push(key);
  }
  return keys;
}

function totalJournalBytes(): number {
  let total = 0;
  for (const key of journalKeys()) {
    const value = localStorage.getItem(key);
    if (value) total += draftByteLength(value);
  }
  return total;
}

function trimJournalBudget(nextBytes: number, path: string): void {
  const keys = journalKeys().filter((k) => k !== DRAFT_STORAGE_PREFIX + path);
  let total = totalJournalBytes() + nextBytes;
  for (const key of keys) {
    if (total <= MAX_DRAFTS_TOTAL_BYTES) break;
    const value = localStorage.getItem(key);
    if (value) total -= draftByteLength(value);
    localStorage.removeItem(key);
  }
}

export function readDraftWeb(path: string): string | null {
  try {
    return localStorage.getItem(DRAFT_STORAGE_PREFIX + path);
  } catch {
    return null;
  }
}

export function rememberDraftWeb(path: string, text: string): boolean {
  try {
    const bytes = draftByteLength(text);
    if (bytes > MAX_DRAFT_BYTES) return false;
    trimJournalBudget(bytes, path);
    if (totalJournalBytes() - draftByteLength(readDraftWeb(path) ?? "") + bytes > MAX_DRAFTS_TOTAL_BYTES) {
      return false;
    }
    localStorage.setItem(DRAFT_STORAGE_PREFIX + path, text);
    return true;
  } catch {
    return false;
  }
}

export function forgetDraftWeb(path: string, savedText?: string): void {
  try {
    const key = DRAFT_STORAGE_PREFIX + path;
    if (savedText === undefined || localStorage.getItem(key) === savedText) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function clearLegacyWebDraftKeys(): { path: string; text: string }[] {
  const migrated: { path: string; text: string }[] = [];
  for (const key of journalKeys()) {
    const text = localStorage.getItem(key);
    if (text == null) continue;
    migrated.push({ path: key.slice(DRAFT_STORAGE_PREFIX.length), text });
  }
  return migrated;
}

export function purgeLegacyWebDraftKeys(): void {
  for (const key of journalKeys()) localStorage.removeItem(key);
}
