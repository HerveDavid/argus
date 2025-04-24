use std::sync::{Arc, Mutex};
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::CommandChild;

mod network;
mod powsybl;
mod settings;
mod shared;
mod sidecars;
mod state;

use network::commands::*;
use powsybl::commands::*;
use settings::commands::*;
use sidecars::{commands::*, despawn_sidecar, spawn_and_monitor_sidecar};
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
            // Sidecars
            start_sidecar,
            shutdown_sidecar,
            // Settings
            set_server_url,
            get_server_url,
            set_zmq_url,
            set_zmq_subscription,
            get_zmq_url,
            // Loaders
            load_client,
            load_substations,
            load_voltage_levels,
            // Substations
            get_substations,
            get_substation_by_id,
            get_paginated_substations,
            search_substations,
            // refactor
            get_substations_n,
            get_substation_by_id_n,
            get_paginated_substations_n,
            search_substations_n,
            load_substations_n,
            // Voltage levels
            get_voltage_levels,
            get_voltage_levels_by_id,
            get_paginated_voltage_levels,
            // Diagrams
            get_single_line_diagram,
            get_single_line_diagram_with_metadata,
            subscribe_single_line_diagram,
            unsubscribe_single_line_diagram,
            // refactor
            get_single_line_diagram_n,
            get_single_line_diagram_metadata_n,
            get_single_line_diagram_with_metadata_n,
            subscribe_single_line_diagram_n,
            unsubscribe_single_line_diagram_n,
        ])
        .setup(|app| {
            app.manage(AppState::default());

            // Store the initial sidecar process in the app state
            app.manage(Arc::new(Mutex::new(None::<CommandChild>)));
            let app_handle = app.handle().clone();
            // Spawn the Python sidecar on startup
            println!("[tauri] Creating sidecar...");
            spawn_and_monitor_sidecar(app_handle).ok();
            println!("[tauri] Sidecar spawned and monitoring started.");

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| match event {
            // Ensure the Python sidecar is killed when the app is closed
            RunEvent::ExitRequested { .. } => despawn_sidecar(app_handle),
            _ => {}
        });
}
