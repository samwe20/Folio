export const DRAFT_STORAGE_PREFIX = "folio.draft.v1:";
export const MAX_DRAFT_BYTES = 512 * 1024;
export const MAX_DRAFTS_TOTAL_BYTES = 4 * 1024 * 1024;
export const JOURNAL_FILE = "folio-recovery-journal.json";

export function draftByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}
