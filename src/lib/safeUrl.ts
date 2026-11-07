/** Allowed schemes for user-visible links in Markdown preview. */
const LINK_RE = /^(https?:|mailto:|#)/i;

/** Safe `data:` image types (SVG and HTML payloads are rejected). */
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|gif|webp);/i;

export function isSafePreviewLinkHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//")) return false;
  return LINK_RE.test(trimmed);
}

export function isRemotePreviewImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  return /^https?:\/\//i.test(trimmed);
}

export function isSafePreviewImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("data:text/") ||
    lower.startsWith("data:image/svg")
  ) {
    return false;
  }
  if (lower.startsWith("data:")) return SAFE_DATA_IMAGE_RE.test(trimmed);
  return /^https?:/i.test(trimmed);
}
