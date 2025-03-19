use tauri::Manager;

mod network;
mod settings;
mod state;

use network::commands::{
    get_paginated_substations, get_single_line_diagram, get_single_line_diagram_with_metadata,
    get_substations, get_voltage_levels,
};
use settings::commands::load_client;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_client,
            get_substations,
            get_paginated_substations,
            get_voltage_levels,
            get_single_line_diagram,
            get_single_line_diagram_with_metadata
        ])
        .setup(|app| {
            app.manage(AppState::default());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
