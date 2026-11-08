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

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

/** Windows / WebView2 often leaves `file.type` empty — infer from extension. */
export function resolveImageMime(file: File): string {
  if (file.type && extensionForImageMime(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? file.type;
}

export function isImageFile(file: File): boolean {
  return Boolean(extensionForImageMime(resolveImageMime(file)));
}

export function isAllowedImageFile(file: File): boolean {
  return isImageFile(file);
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp)$/i;

export function isImagePath(path: string): boolean {
  return IMAGE_EXT_RE.test(path.trim());
}

/** `file:///C:/…` from Explorer drag-and-drop (WebView2). */
export function filePathFromUriList(data: DataTransfer): string | null {
  const line = data
    .getData("text/uri-list")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));
  if (!line?.toLowerCase().startsWith("file:")) return null;
  try {
    let path = decodeURIComponent(new URL(line).pathname);
    if (/^\/[A-Za-z]:/.test(path)) path = path.slice(1);
    path = path.replace(/\//g, "\\");
    return path;
  } catch {
    return null;
  }
}

export function extensionForImageMime(mime: string): string | null {
  return IMAGE_EXT[mime.toLowerCase()] ?? null;
}

export function imageMimeFromPath(path: string): string | null {
  const ext = path.split(/[/\\]/).pop()?.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? null;
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

const IMAGE_REF_EXT_RE = /\.(png|jpe?g|gif|webp)$/i;

/**
 * Markdown may reference `stem`, `![](stem)`, or a bare screenshot name without `assets/` or extension.
 * Map those to a library-relative `assets/…` path for preview (and drop repair).
 */
export function normalizeLibraryImageRef(src: string): string {
  let rel = src.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!rel || rel.includes("..")) return rel;
  if (/^assets\//i.test(rel) && IMAGE_REF_EXT_RE.test(rel)) return rel;
  const stem = rel.replace(/^assets\//i, "").replace(/\.[^.]+$/, "");
  if (!stem) return rel;
  if (IMAGE_REF_EXT_RE.test(rel)) {
    return rel.startsWith("assets/") ? rel : `${LIBRARY_ASSETS_DIR}/${rel}`;
  }
  return `${LIBRARY_ASSETS_DIR}/${stem}.png`;
}

function libraryImageStemVariants(src: string): string[] {
  const trimmed = src.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  const rawStem = trimmed.replace(/^assets\//i, "").replace(/\.[^.]+$/, "");
  const normalizedStem = normalizeLibraryImageRef(trimmed)
    .replace(/^assets\//i, "")
    .replace(/\.[^.]+$/, "");
  const stems = new Set<string>();
  if (rawStem) stems.add(rawStem);
  if (normalizedStem) stems.add(normalizedStem);
  if (rawStem) stems.add(safeImageBaseName(rawStem));
  if (normalizedStem) stems.add(safeImageBaseName(normalizedStem));
  return [...stems];
}

/** Try common extensions (and dashed stems) when markdown does not match the saved filename. */
export function libraryImageRefCandidates(src: string): string[] {
  const stems = libraryImageStemVariants(src);
  if (!stems.length) return [normalizeLibraryImageRef(src)];
  const exts = ["png", "jpg", "jpeg", "gif", "webp"];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const stem of stems) {
    for (const ext of exts) {
      const candidate = `${LIBRARY_ASSETS_DIR}/${stem}.${ext}`;
      if (!seen.has(candidate)) {
        seen.add(candidate);
        out.push(candidate);
      }
    }
  }
  return out;
}
