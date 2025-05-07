use std::sync::{Arc, Mutex};
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::CommandChild;

mod broker;
mod diagrams;
mod powsybl;
mod settings;
mod shared;
mod sidecars;
mod state;

use powsybl::commands::*;
use settings::commands::*;
use sidecars::{commands::*, despawn_sidecar, spawn_and_monitor_sidecar};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .build(),
        )
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
            // Substations
            get_substations,
            get_substation_by_id,
            get_paginated_substations,
            search_substations,
            load_substations,
            // Voltage levels
            get_voltage_levels,
            get_voltage_levels_by_id,
            get_paginated_voltage_levels,
            get_voltage_levels_for_substation,
            search_voltage_levels,
            load_voltage_levels,
            // Diagrams
            get_single_line_diagram,
            get_single_line_diagram_metadata,
            get_single_line_diagram_with_metadata,
            subscribe_single_line_diagram,
            unsubscribe_single_line_diagram,
            // diagrams
            diagrams::commands::subscribe_diagram,
            diagrams::commands::unsubscribe_diagram,
            diagrams::commands::update_feeders,
            diagrams::commands::update_events,
            diagrams::commands::event_open_breaker,
            diagrams::commands::event_close_breaker,
        ])
        .setup(|app| {
            app.manage(AppState::default());

            // Store the initial sidecar process in the app state
            app.manage(Arc::new(Mutex::new(None::<CommandChild>)));

            let app_handle = app.handle().clone();
            // Spawn the Python sidecar on startup
            spawn_and_monitor_sidecar(app_handle).ok();

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
