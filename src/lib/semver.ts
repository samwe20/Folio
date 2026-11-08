/** Parse GitHub release tag `folio-X.Y.Z` (optional pre-release suffix ignored for compare). */
export function parseFolioReleaseTag(tag: string): string | null {
  const trimmed = tag.trim();
  const match = /^folio-(\d+\.\d+\.\d+)/i.exec(trimmed);
  return match ? match[1] : null;
}

/** `1.0.8-rc.2` → `1.0.8` for update comparison. */
export function parseSemverCore(version: string): string | null {
  const match = /^(\d+\.\d+\.\d+)/.exec(version.trim());
  return match ? match[1] : null;
}

/** Compare dotted semver cores; returns positive if `a` is newer than `b`. */
export function compareSemver(a: string, b: string): number {
  const ca = parseSemverCore(a) ?? a;
  const cb = parseSemverCore(b) ?? b;
  const pa = ca.split(".").map((part) => Number.parseInt(part, 10));
  const pb = cb.split(".").map((part) => Number.parseInt(part, 10));
  for (let i = 0; i < 3; i++) {
    const da = Number.isFinite(pa[i]) ? pa[i]! : 0;
    const db = Number.isFinite(pb[i]) ? pb[i]! : 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}
