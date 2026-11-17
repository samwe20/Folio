/** Filesystem event narrow enough for the sidebar watcher. Matches `@tauri-apps/plugin-fs` `WatchEvent`. */
export interface LibraryWatchEvent {
  type:
    | "any"
    | "other"
    | { access: { kind: string } }
    | { create: { kind: string } }
    | { modify: { kind: string } }
    | { remove: { kind: string } };
  paths: string[];
}

export function normalizeLibraryPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

function baseName(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const cut = normalized.lastIndexOf("/");
  return cut === -1 ? normalized : normalized.slice(cut + 1);
}

/** Atomic saves and dotfiles do not change the folder tree. */
function isIgnoredWatchPath(path: string): boolean {
  const name = baseName(path);
  return name.startsWith(".") || name.toLowerCase().endsWith(".tmp");
}

/**
 * True when the sidebar should rescan. Content writes of notes already in the
 * list are ignored; a new folder or file, a removal, or a rename onto a new
 * path is not.
 */
export function libraryEventAffectsSidebar(
  event: LibraryWatchEvent,
  knownNotePaths: ReadonlySet<string>,
): boolean {
  const type = event.type;
  if (typeof type === "object" && type !== null && "access" in type) return false;
  if (typeof type === "object" && type !== null && "modify" in type) {
    const kind = type.modify.kind;
    if (kind !== "rename" && kind !== "any" && kind !== "other") return false;
  }

  const meaningful = event.paths.filter((path) => !isIgnoredWatchPath(path));
  if (meaningful.length === 0) return event.paths.length === 0 && type === "any";
  if (typeof type === "object" && type !== null && "remove" in type) return true;
  return meaningful.some((path) => !knownNotePaths.has(normalizeLibraryPath(path)));
}
