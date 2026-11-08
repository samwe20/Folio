use std::path::Path;
use tauri_plugin_fs::FsExt;

const IMAGE_EXT: &[&str] = &["png", "jpg", "jpeg", "gif", "webp"];

#[tauri::command]
fn read_dropped_image_file(path: String) -> Result<Vec<u8>, String> {
    let path = Path::new(&path);
    if !path.is_absolute() {
        return Err("Path must be absolute".into());
    }
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !IMAGE_EXT.contains(&ext.as_str()) {
        return Err("Unsupported image type".into());
    }
    std::fs::read(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn allow_library_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let path = Path::new(&path);
    if !path.is_absolute() {
        return Err("Library path must be absolute".into());
    }
    app.fs_scope()
        .allow_directory(path, true)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![allow_library_path, read_dropped_image_file])
        .run(tauri::generate_context!())
        .expect("error while running Folio");
}
