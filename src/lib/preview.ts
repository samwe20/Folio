import DOMPurify from "dompurify";
import { Marked } from "marked";
import type { NoteIndex } from "./noteIndex";
import { isRemotePreviewImageSrc, isSafePreviewImageSrc, isSafePreviewLinkHref } from "./safeUrl";

const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const PREVIEW_FORBID_TAGS = [
  "style",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "base",
  "link",
  "meta",
  "object",
  "embed",
  "iframe",
  "frame",
  "frameset",
  "video",
  "audio",
  "svg",
  "math",
] as const;

export const PREVIEW_SANITIZE = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: [...PREVIEW_FORBID_TAGS],
  FORBID_ATTR: ["style", "id", "name", "srcdoc", "formaction"],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ["data-wiki-title", "referrerpolicy", "loading", "data-remote-blocked"],
};

export type PreviewOptions = {
  allowRemoteImages?: boolean;
  blockedImageLabel?: string;
  /** Rewrite local asset paths (e.g. library files) to displayable URLs. */
  resolveAssetSrc?: (src: string) => string;
};

let previewHooksInstalled = false;
let previewHookOptions: Required<Pick<PreviewOptions, "allowRemoteImages" | "blockedImageLabel">> & {
  resolveAssetSrc?: (src: string) => string;
} = {
  allowRemoteImages: false,
  blockedImageLabel: "",
};

function blockedImagePlaceholder(src: string, label: string): string {
  const safeSrc = escape(src);
  const safeLabel = escape(label || "Image blocked");
  return `<span class="preview-img-placeholder" data-remote-blocked="1" title="${safeSrc}">${safeLabel}</span>`;
}

function ensurePreviewSanitizeHooks(): void {
  if (previewHooksInstalled) return;
  previewHooksInstalled = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!(node instanceof Element)) return;
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      if (node.hasAttribute("data-wiki-title") || href === "#") {
        node.setAttribute("rel", "noreferrer noopener");
        return;
      }
      if (!isSafePreviewLinkHref(href)) node.removeAttribute("href");
      node.setAttribute("rel", "noreferrer noopener");
    }
    if (node.tagName === "IMG") {
      let src = node.getAttribute("src") ?? "";
      if (src && previewHookOptions.resolveAssetSrc) {
        src = previewHookOptions.resolveAssetSrc(src);
        node.setAttribute("src", src);
      }
      if (!previewHookOptions.allowRemoteImages && src && isRemotePreviewImageSrc(src)) {
        const placeholder = blockedImagePlaceholder(src, previewHookOptions.blockedImageLabel);
        const template = document.createElement("template");
        template.innerHTML = placeholder;
        const replacement = template.content.firstElementChild;
        if (replacement) node.replaceWith(replacement);
        return;
      }
      if (src && !isSafePreviewImageSrc(src)) node.removeAttribute("src");
      node.setAttribute("referrerpolicy", "no-referrer");
      node.setAttribute("loading", "lazy");
    }
  });
}

export function renderMarkdown(text: string, index: NoteIndex, options: PreviewOptions = {}): string {
  ensurePreviewSanitizeHooks();
  previewHookOptions = {
    allowRemoteImages: options.allowRemoteImages ?? false,
    blockedImageLabel: options.blockedImageLabel ?? "",
    resolveAssetSrc: options.resolveAssetSrc,
  };
  const parser = new Marked({ gfm: true, breaks: true });
  parser.use({ extensions: [{
    name: "wikilink",
    level: "inline",
    start: (src) => src.indexOf("[["),
    tokenizer(src) {
      const match = /^\[\[([^\]|#<>"&\n]+)(?:\|([^\]<>"&\n]+))?\]\]/.exec(src);
      if (!match) return;
      return { type: "wikilink", raw: match[0], title: match[1].trim(), label: (match[2] ?? match[1]).trim() };
    },
    renderer(token) {
      const cls = index.resolve(token.title) ? "wiki-link" : "wiki-link missing";
      return `<a class="${cls}" href="#" data-wiki-title="${escape(token.title)}">${escape(token.label)}</a>`;
    },
  }] });
  return String(DOMPurify.sanitize(parser.parse(text) as string, PREVIEW_SANITIZE));
}
