/** Path label shown only when capturing marketing screenshots in a browser. */
export const MARKETING_DESKTOP_LIBRARY_LABEL = "C:\\Users\\Demo\\Documents\\Folio\\Library";

type FolioWindow = Window & {
  __FOLIO_MARKETING_DESKTOP__?: boolean;
};

/** Playwright marketing captures set this flag to render desktop chrome without Tauri FS. */
export function isMarketingDesktopCapture(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as FolioWindow).__FOLIO_MARKETING_DESKTOP__)
  );
}

/** Desktop UI (Tauri or marketing capture) — hides web/PWA chrome such as the library overflow menu. */
export function isDesktopUi(): boolean {
  return isTauri() || isMarketingDesktopCapture();
}

/** True when running inside a Tauri webview. */
export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

export const WEB_LIBRARY_PATH = "web://library";
