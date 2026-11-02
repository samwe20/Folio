import type { AppSettings, NoteMeta } from "../types";
import { sortLocaleTag } from "./i18n";

export function sortNotes(notes: NoteMeta[], settings: Pick<AppSettings, "sortBy" | "sortDirection" | "uiLocale">): NoteMeta[] {
  const collator = new Intl.Collator(sortLocaleTag(settings.uiLocale), { sensitivity: "base", numeric: true });
  const direction = settings.sortDirection === "desc" ? -1 : 1;
  return [...notes].sort((a, b) => {
    if (settings.sortBy === "createdAt") {
      // Unknown creation dates stay last in either direction.
      if (a.createdAt === null && b.createdAt !== null) return 1;
      if (b.createdAt === null && a.createdAt !== null) return -1;
      if (a.createdAt !== null && b.createdAt !== null && a.createdAt !== b.createdAt) {
        return (a.createdAt - b.createdAt) * direction;
      }
    }
    return (collator.compare(a.title, b.title) || collator.compare(a.relativePath, b.relativePath)) * direction;
  });
}
