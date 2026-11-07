import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./runtime";

/** Runtime FS scope for the library folder (persisted via tauri-plugin-persisted-scope on desktop). */
export async function ensureLibraryFsScope(libraryPath: string): Promise<void> {
  if (!isTauri() || !libraryPath) return;
  try {
    await invoke("allow_library_path", { path: libraryPath });
  } catch (error) {
    console.error("Failed to extend library filesystem scope", error);
    throw error;
  }
}
