import { isTauri } from "./runtime";

const buildVersion =
  typeof __FOLIO_VERSION__ !== "undefined" ? __FOLIO_VERSION__ : "0.0.0";

/** Desktop uses Tauri `getVersion()`; web/tests use the build-time package version. */
export async function getAppVersion(): Promise<string> {
  if (isTauri()) {
    try {
      const { getVersion } = await import("@tauri-apps/api/app");
      const v = await getVersion();
      if (v) return v;
    } catch {
      /* fall back */
    }
  }
  return buildVersion;
}
