import type { EditorFontId } from "./lib/fonts";
import type { UiLocale } from "./lib/i18n";

export interface NoteMeta {
  id: string;
  title: string;
  path: string;
  relativePath: string;
  mtime: number;
  createdAt: number | null;
}

export interface AppSettings {
  libraryPath: string | null;
  theme: "light" | "dark";
  focusMode: boolean;
  typewriter: boolean;
  showBacklinks: boolean;
  lastOpenPath: string | null;
  editorFont: EditorFontId;
  sortBy: "title" | "createdAt";
  sortDirection: "asc" | "desc";
  uiLocale: UiLocale;
  /** Default: remote http(s) images in preview are blocked (tracking-pixel mitigation). */
  previewRemoteImagesGlobal: boolean;
  /** Per-note override for remote images in preview (path → allow). */
  previewRemoteImagesNotes: Record<string, boolean>;
}

export interface WikiTarget {
  raw: string;
  title: string;
  alias?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  libraryPath: null,
  theme: "light",
  focusMode: false,
  typewriter: false,
  showBacklinks: true,
  lastOpenPath: null,
  editorFont: "literata",
  sortBy: "title",
  sortDirection: "asc",
  uiLocale: "en",
  previewRemoteImagesGlobal: false,
  previewRemoteImagesNotes: {},
};
