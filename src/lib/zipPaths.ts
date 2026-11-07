/** Reject zip-slip and other unsafe archive member paths before extraction. */
export function isSafeZipEntryName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  if (name.includes("\0")) return false;
  const normalized = name.replace(/\\/g, "/");
  if (normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized)) return false;
  const segments = normalized.split("/");
  if (segments.some((s) => s === "..")) return false;
  if (!/\.md$/i.test(normalized)) return false;
  return true;
}

/** Upper bound for total uncompressed bytes when importing archives (zip bomb mitigation). */
export const ZIP_IMPORT_MAX_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;

export function zipImportSizeAllowed(totalBytes: number): boolean {
  return totalBytes >= 0 && totalBytes <= ZIP_IMPORT_MAX_UNCOMPRESSED_BYTES;
}
