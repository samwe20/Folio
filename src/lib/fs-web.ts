import type { NoteMeta } from "../types";
import { noteIdFromRelative, titleFromPath } from "./paths";
import { safeNoteTitle } from "./names";
import { demoNotes } from "./demoContent";
import type { UiLocale } from "./i18n";
import { WEB_LIBRARY_PATH, isMarketingDesktopCapture, MARKETING_DESKTOP_LIBRARY_LABEL } from "./runtime";

function webLibraryRoot(): string {
  return isMarketingDesktopCapture() ? MARKETING_DESKTOP_LIBRARY_LABEL : WEB_LIBRARY_PATH;
}

const DB_NAME = "folio-notes";
const STORE = "notes";
let connection: Promise<IDBDatabase> | undefined;
export interface WebNoteRecord { path: string; title: string; content: string; mtime: number; createdAt?: number | null; }

function openDb(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "path" });
      req.onsuccess = () => {
        req.result.onversionchange = () => { req.result.close(); connection = undefined; };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
      req.onblocked = () => reject(new Error("Zavřete ostatní okna Folia a zkuste to znovu."));
    }).catch(error => { connection = undefined; throw error; });
  }
  return connection;
}

async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let value: T;
    tx.oncomplete = () => resolve(value);
    tx.onabort = () => reject(tx.error ?? new Error("Uložení bylo přerušeno."));
    tx.onerror = () => { /* onabort reports failure after rollback */ };
    try { operation(tx.objectStore(STORE), result => { value = result; }); }
    catch (error) { tx.abort(); reject(error); }
  });
}

function relativeOf(path: string) {
  const root = webLibraryRoot();
  return path.startsWith(root + "/") ? path.slice(root.length + 1) : path.replace(/^\/+/, "");
}
function record(path: string, content: string, previous?: WebNoteRecord): WebNoteRecord {
  return { path, title: titleFromPath(path), content, mtime: Date.now(), createdAt: previous ? previous.createdAt ?? null : Date.now() };
}
function freeName(store: IDBObjectStore, safe: string, use: (name: string) => void, oldPath?: string) {
  const req = store.getAllKeys();
  req.onsuccess = () => {
    const taken = new Set(req.result.filter(key => key !== oldPath).map(key => String(key).toLowerCase()));
    let candidate = safe + ".md";
    let suffix = 2;
    while (taken.has(candidate.toLowerCase())) candidate = safe + " " + suffix++ + ".md";
    use(candidate);
  };
}
export async function getDefaultLibraryPath() {
  return webLibraryRoot();
}
export async function listNotes(_libraryPath: string): Promise<NoteMeta[]> {
  const records = await transaction<WebNoteRecord[]>("readonly", (store, done) => {
    const req = store.getAll(); req.onsuccess = () => done(req.result);
  });
  const root = webLibraryRoot();
  return records.map(r => ({ id: noteIdFromRelative(r.path), title: r.title, path: root + "/" + r.path, relativePath: r.path, mtime: r.mtime, createdAt: r.createdAt ?? null }))
    .sort((a,b) => a.title.localeCompare(b.title, "cs", { sensitivity: "base" }));
}
export async function readNote(path: string): Promise<string> {
  const found = await transaction<WebNoteRecord | undefined>("readonly", (store, done) => {
    const req = store.get(relativeOf(path)); req.onsuccess = () => done(req.result);
  });
  if (!found) throw new Error("Note not found: " + path);
  return found.content;
}
export async function writeNote(path: string, content: string): Promise<void> {
  await transaction<void>("readwrite", store => {
    const relative = relativeOf(path);
    const req = store.get(relative);
    req.onsuccess = () => store.put(record(relative, content, req.result));
  });
}
export async function createNote(_libraryPath: string, title: string, content = ""): Promise<string> {
  return transaction<string>("readwrite", (store, done) => {
    const root = webLibraryRoot();
    freeName(store, safeNoteTitle(title), name => { store.add(record(name, content)); done(root + "/" + name); });
  });
}
export async function renameNote(oldPath: string, newTitle: string): Promise<string> {
  const oldRel = relativeOf(oldPath);
  return transaction<string>("readwrite", (store, done) => {
    const req = store.get(oldRel);
    req.onsuccess = () => {
      if (!req.result) { store.transaction.abort(); return; }
      const parent = oldRel.includes("/") ? oldRel.slice(0, oldRel.lastIndexOf("/") + 1) : "";
      freeName(store, parent + safeNoteTitle(newTitle), name => {
        if (name !== oldRel) {
          store.add(record(name, req.result.content, req.result));
          store.delete(oldRel);
        }
        done(webLibraryRoot() + "/" + name);
      }, oldRel);
    };
  });
}
export async function deleteNote(path: string): Promise<void> {
  await transaction<void>("readwrite", store => { store.delete(relativeOf(path)); });
}

export async function createDemoLibrary(_libraryPath: string, locale: UiLocale = "cs"): Promise<string> {
  const root = webLibraryRoot();
  const existing = await listNotes(root);
  if (existing.length) {
    return (
      existing.find((n) => n.title === "Vítejte ve Folio" || n.title === "Welcome to Folio")?.path ??
      existing[0].path
    );
  }

  const notes = demoNotes(locale);
  for (const note of notes) {
    await writeNote(`${root}/${note.fileName}`, note.content);
  }
  return `${root}/${notes[0].fileName}`;
}
