import { isTauri } from "./runtime";

export const FOLIO_RELEASE_URL_PREFIX = "https://github.com/samwe20/Folio/releases/";

export function isSafeFolioReleaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.href.startsWith(FOLIO_RELEASE_URL_PREFIX);
  } catch {
    return false;
  }
}

/** Open a validated Folio GitHub release page in the system browser (desktop only). */
export async function openFolioReleaseUrl(url: string): Promise<void> {
  if (!isSafeFolioReleaseUrl(url)) return;
  if (!isTauri()) return;
  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(url);
}
