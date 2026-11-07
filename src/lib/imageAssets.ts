const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export const LIBRARY_ASSETS_DIR = "assets";

/** Relative markdown paths for library-stored images (not remote URLs or data:). */
export function isLocalPreviewImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (/^(https?:|data:|\/\/|file:)/i.test(trimmed)) return false;
  if (trimmed.includes("..")) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9_./ -]*$/.test(trimmed);
}

export function isAllowedImageFile(file: File): boolean {
  if (!file.type.startsWith("image/")) return false;
  return Boolean(extensionForImageMime(file.type));
}

export function extensionForImageMime(mime: string): string | null {
  return IMAGE_EXT[mime.toLowerCase()] ?? null;
}

export function safeImageBaseName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim();
  let safe = base
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safe || "image";
}

export function altTextFromFileName(name: string): string {
  return safeImageBaseName(name).replace(/-/g, " ");
}

export function imageMarkdown(relativeOrDataSrc: string, alt: string): string {
  const safeAlt = alt.replace(/[\[\]]/g, "");
  return `![${safeAlt}](${relativeOrDataSrc})`;
}

export function joinLibraryRelativePath(libraryPath: string, relative: string): string {
  const rel = relative.replace(/\\/g, "/").replace(/^\/+/, "");
  const root = libraryPath.replace(/[/\\]+$/, "");
  const sep = libraryPath.includes("\\") ? "\\" : "/";
  return `${root}${sep}${rel.replace(/\//g, sep)}`;
}
