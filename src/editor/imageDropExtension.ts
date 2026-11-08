import { EditorView } from "@codemirror/view";
import { filePathFromUriList, isImageFile, isImagePath } from "../lib/imageAssets";

export type ImageFileHandler = (file: File) => Promise<string | null>;
export type ImagePathHandler = (path: string) => Promise<string | null>;

export type ImageDropHandlers = {
  onFile: ImageFileHandler;
  onPath?: ImagePathHandler;
  onRejected?: () => void;
};

function collectImageFiles(data: DataTransfer): File[] {
  const out: File[] = [];
  const seen = new Set<File>();
  if (data.files?.length) {
    for (const file of data.files) {
      if (!seen.has(file) && isImageFile(file)) {
        seen.add(file);
        out.push(file);
      }
    }
  }
  if (data.items) {
    for (const item of data.items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file && !seen.has(file) && isImageFile(file)) {
        seen.add(file);
        out.push(file);
      }
    }
  }
  return out;
}

function firstImageFile(data: DataTransfer | null): File | null {
  return data ? (collectImageFiles(data)[0] ?? null) : null;
}

function transferLooksLikeFileDrop(data: DataTransfer | null): boolean {
  if (!data) return false;
  if (data.types?.includes("Files")) return true;
  if (data.files?.length) return true;
  return [...(data.items ?? [])].some((item) => item.kind === "file");
}

function insertAt(view: EditorView, pos: number, markdown: string) {
  view.dispatch({
    changes: { from: pos, insert: markdown },
    selection: { anchor: pos + markdown.length },
  });
  view.focus();
}

/** Windows sometimes leaves plain text or `![](stem)` while the file was saved under `assets/`. */
function applyImageMarkdown(view: EditorView, pos: number, markdown: string, plainHint: string) {
  const stem = plainHint.trim();
  if (stem) {
    const doc = view.state.doc;
    const windowStart = Math.max(0, pos - 80);
    const windowEnd = Math.min(doc.length, pos + 80);
    const slice = doc.sliceString(windowStart, windowEnd);
    const replacements = [`![](${stem})`, `![${stem}](${stem})`, stem];
    for (const needle of replacements) {
      const idx = slice.indexOf(needle);
      if (idx < 0) continue;
      const from = windowStart + idx;
      view.dispatch({
        changes: { from, to: from + needle.length, insert: markdown },
        selection: { anchor: from + markdown.length },
      });
      view.focus();
      return;
    }
  }
  insertAt(view, pos, markdown);
}

export function imageDropExtension(handlers: ImageDropHandlers) {
  return EditorView.domEventHandlers({
    dragover(event) {
      if (!transferLooksLikeFileDrop(event.dataTransfer) && !firstImageFile(event.dataTransfer)) {
        return false;
      }
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      return true;
    },
    drop(event, view) {
      const data = event.dataTransfer;
      if (!data) return false;
      const file = firstImageFile(data);
      const at = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
      const pos = at ?? view.state.selection.main.head;

      const plainHint = data.getData("text/plain").trim() || file?.name.replace(/\.[^.]+$/, "") || "";

      if (file) {
        event.preventDefault();
        void handlers.onFile(file).then((markdown) => {
          if (markdown) applyImageMarkdown(view, pos, markdown, plainHint);
        });
        return true;
      }

      const path = filePathFromUriList(data);
      if (path && isImagePath(path) && handlers.onPath) {
        event.preventDefault();
        const pathHint = path.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, "") ?? plainHint;
        void handlers.onPath(path).then((markdown) => {
          if (markdown) applyImageMarkdown(view, pos, markdown, pathHint);
        });
        return true;
      }

      if (transferLooksLikeFileDrop(data)) {
        event.preventDefault();
        handlers.onRejected?.();
        return true;
      }

      return false;
    },
    paste(event, view) {
      const file = firstImageFile(event.clipboardData);
      if (!file) return false;
      event.preventDefault();
      const pos = view.state.selection.main.head;
      void handlers.onFile(file).then((markdown) => {
        if (markdown) insertAt(view, pos, markdown);
      });
      return true;
    },
  });
}
