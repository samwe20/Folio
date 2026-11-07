import { getAppVersion } from "./appVersion";
import { isSafeFolioReleaseUrl } from "./openRelease";
import { compareSemver, parseFolioReleaseTag } from "./semver";
import { isTauri } from "./runtime";

export const UPDATE_CHECK_STORAGE_KEY = "folio.update.lastCheckAt";
export const UPDATE_DISMISS_STORAGE_KEY = "folio.update.dismissedVersion";
export const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/samwe20/Folio/releases/latest";

export const UPDATE_CHECK_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const UPDATE_STARTUP_DELAY_MS = 4500;
export const UPDATE_FETCH_TIMEOUT_MS = 8000;

export type GitHubLatestRelease = {
  tag_name: string;
  html_url: string;
};

export type UpdateOffer = {
  version: string;
  url: string;
};

export function shouldCheckForUpdate(now = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(UPDATE_CHECK_STORAGE_KEY);
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    return now - last >= UPDATE_CHECK_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function markUpdateChecked(now = Date.now()): void {
  try {
    localStorage.setItem(UPDATE_CHECK_STORAGE_KEY, String(now));
  } catch {
    /* ignore */
  }
}

export function isUpdateDismissed(version: string): boolean {
  try {
    return localStorage.getItem(UPDATE_DISMISS_STORAGE_KEY) === version;
  } catch {
    return false;
  }
}

export function dismissUpdateVersion(version: string): void {
  try {
    localStorage.setItem(UPDATE_DISMISS_STORAGE_KEY, version);
  } catch {
    /* ignore */
  }
}

export async function fetchLatestGitHubRelease(
  signal?: AbortSignal,
): Promise<GitHubLatestRelease | null> {
  try {
    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
      signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as GitHubLatestRelease;
    if (typeof data.tag_name !== "string" || typeof data.html_url !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

export type ResolveUpdateOfferOptions = {
  /** When true, still offer an update the user previously dismissed (manual check). */
  ignoreDismiss?: boolean;
};

export function resolveUpdateOffer(
  currentVersion: string,
  release: GitHubLatestRelease | null,
  options?: ResolveUpdateOfferOptions,
): UpdateOffer | null {
  if (!release) return null;
  const latest = parseFolioReleaseTag(release.tag_name);
  if (!latest) return null;
  if (!isSafeFolioReleaseUrl(release.html_url)) return null;
  if (compareSemver(latest, currentVersion) <= 0) return null;
  if (!options?.ignoreDismiss && isUpdateDismissed(latest)) return null;
  return { version: latest, url: release.html_url };
}

export type ManualUpdateResult =
  | { status: "offer"; offer: UpdateOffer; current: string }
  | { status: "current"; current: string; latestTag: string | null }
  | { status: "error" };

export type UpdateNoticeUi = {
  show(offer: UpdateOffer): void;
};

export function scheduleDesktopUpdateCheck(ui: UpdateNoticeUi): void {
  if (!isTauri()) return;
  window.setTimeout(() => {
    void runDesktopUpdateCheck(ui);
  }, UPDATE_STARTUP_DELAY_MS);
}

export async function runDesktopUpdateCheck(ui: UpdateNoticeUi): Promise<void> {
  if (!isTauri() || !shouldCheckForUpdate()) return;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), UPDATE_FETCH_TIMEOUT_MS);
  markUpdateChecked();
  try {
    const release = await fetchLatestGitHubRelease(controller.signal);
    const current = await getAppVersion();
    const offer = resolveUpdateOffer(current, release);
    if (offer) ui.show(offer);
  } finally {
    clearTimeout(timeout);
  }
}

/** User-initiated check (ignores 24h cooldown and dismissed versions). */
export async function runManualUpdateCheck(ui?: UpdateNoticeUi): Promise<ManualUpdateResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), UPDATE_FETCH_TIMEOUT_MS);
  try {
    const release = await fetchLatestGitHubRelease(controller.signal);
    const current = await getAppVersion();
    markUpdateChecked();
    const offer = resolveUpdateOffer(current, release, { ignoreDismiss: true });
    if (offer) {
      ui?.show(offer);
      return { status: "offer", offer, current };
    }
    const latestTag = release ? parseFolioReleaseTag(release.tag_name) : null;
    return { status: "current", current, latestTag };
  } catch {
    return { status: "error" };
  } finally {
    clearTimeout(timeout);
  }
}
