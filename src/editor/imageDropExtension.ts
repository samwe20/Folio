import { EditorView } from "@codemirror/view";
import { isAllowedImageFile } from "../lib/imageAssets";

export type ImageFileHandler = (file: File) => Promise<string | null>;

function firstImageFile(data: DataTransfer | null): File | null {
  if (!data?.files?.length) return null;
  for (const file of data.files) {
    if (isAllowedImageFile(file)) return file;
  }
  return null;
}

function dataTransferHasImage(data: DataTransfer | null): boolean {
  return firstImageFile(data) !== null;
}

export function imageDropExtension(onImageFile: ImageFileHandler) {
  return EditorView.domEventHandlers({
    dragover(event) {
      if (!dataTransferHasImage(event.dataTransfer)) return false;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      return true;
    },
    drop(event, view) {
      const file = firstImageFile(event.dataTransfer);
      if (!file) return false;
      event.preventDefault();
      const at = view.posAtCoords({ x: event.clientX, y: event.clientY }, false);
      const pos = at ?? view.state.selection.main.head;
      void onImageFile(file).then((markdown) => {
        if (!markdown) return;
        view.dispatch({
          changes: { from: pos, insert: markdown },
          selection: { anchor: pos + markdown.length },
        });
        view.focus();
      });
      return true;
    },
    paste(event, view) {
      const file = firstImageFile(event.clipboardData);
      if (!file) return false;
      event.preventDefault();
      const pos = view.state.selection.main.head;
      void onImageFile(file).then((markdown) => {
        if (!markdown) return;
        view.dispatch({
          changes: { from: pos, insert: markdown },
          selection: { anchor: pos + markdown.length },
        });
        view.focus();
      });
      return true;
    },
  });
}
