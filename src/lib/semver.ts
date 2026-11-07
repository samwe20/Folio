/** Parse GitHub release tag `folio-X.Y.Z` (optional pre-release suffix ignored for compare). */
export function parseFolioReleaseTag(tag: string): string | null {
  const trimmed = tag.trim();
  const match = /^folio-(\d+\.\d+\.\d+)/i.exec(trimmed);
  return match ? match[1] : null;
}

/** Compare dotted semver cores; returns positive if `a` is newer than `b`. */
export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((part) => Number.parseInt(part, 10));
  const pb = b.split(".").map((part) => Number.parseInt(part, 10));
  for (let i = 0; i < 3; i++) {
    const da = Number.isFinite(pa[i]) ? pa[i]! : 0;
    const db = Number.isFinite(pb[i]) ? pb[i]! : 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}
