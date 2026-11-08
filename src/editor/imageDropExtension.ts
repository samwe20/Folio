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

      if (file) {
        event.preventDefault();
        void handlers.onFile(file).then((markdown) => {
          if (markdown) insertAt(view, pos, markdown);
        });
        return true;
      }

      const path = filePathFromUriList(data);
      if (path && isImagePath(path) && handlers.onPath) {
        event.preventDefault();
        void handlers.onPath(path).then((markdown) => {
          if (markdown) insertAt(view, pos, markdown);
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
