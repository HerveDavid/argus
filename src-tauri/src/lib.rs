use database::{DatabaseInner, DatabaseState};
use std::sync::{Arc, Mutex};
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::CommandChild;

mod broker;
mod database;
mod powsybl;
mod settings;
mod shared;
mod sidecars;
mod state;

use broker::{
    commands::*,
    state::{BrokerState, BrokerStateInner},
};
use powsybl::commands::*;
use settings::commands::*;
use sidecars::{commands::*, despawn_sidecar, spawn_and_monitor_sidecar};
use state::AppStateInner;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // Broker (nats)
            connect_broker,
            disconnect_broker,
            // Sidecars
            start_sidecar,
            shutdown_sidecar,
            // Settings
            set_server_url,
            get_server_url,
            set_zmq_url,
            set_zmq_subscription,
            get_zmq_url,
            load_config_file,
            // Loaders
            load_client,
            load_game_master_outputs_in_db, // Substations
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
        ])
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                // Global app state (todo: to remove)
                let app_state = AppStateInner::new(&app.handle())
                    .await
                    .expect("Failed to initialize app state");
                app.manage(app_state);

                // Sidecar state
                // Store the initial sidecar process in the app state
                app.manage(Arc::new(Mutex::new(None::<CommandChild>)));

                let app_handle = app.handle().clone();
                // Spawn the Python sidecar on startup
                spawn_and_monitor_sidecar(app_handle).ok();

                // Database state
                let database_state = DatabaseInner::new(&app.handle())
                    .await
                    .expect("Failed to initialize database state");
                app.manage(DatabaseState::new(database_state));

                // Broker state
                let broker_state = BrokerStateInner::new()
                    .await
                    .expect("Failed to initialize broker state");
                app.manage(BrokerState::new(broker_state));
            });

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
