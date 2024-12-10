#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Tauri plugins
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        // Internal plugins
        .plugin(game_engine::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
