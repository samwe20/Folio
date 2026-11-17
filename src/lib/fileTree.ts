import type { NoteMeta } from "../types";

export interface FolderNode {
  name: string;
  path: string;
  folders: Map<string, FolderNode>;
  notes: NoteMeta[];
}

function childFolder(parent: FolderNode, name: string, path: string): FolderNode {
  let child = parent.folders.get(name);
  if (!child) {
    child = { name, path, folders: new Map(), notes: [] };
    parent.folders.set(name, child);
  }
  return child;
}

/** Folders are included even when they contain no notes yet. */
export function buildFileTree(notes: NoteMeta[], folderPaths: readonly string[]): FolderNode {
  const root: FolderNode = { name: "", path: "", folders: new Map(), notes: [] };
  const ensure = (relative: string): FolderNode => {
    const parts = relative.replace(/\\/g, "/").split("/").filter(Boolean);
    let node = root;
    let path = "";
    for (const part of parts) {
      path = path ? `${path}/${part}` : part;
      node = childFolder(node, part, path);
    }
    return node;
  };

  for (const folder of folderPaths) ensure(folder);
  for (const note of notes) {
    const parts = note.relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
    parts.pop();
    ensure(parts.join("/")).notes.push(note);
  }
  return root;
}
