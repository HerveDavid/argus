mod commands;

use std::sync::{Arc, Mutex};

use commands::despawn_sidecar;
use tauri::{
    Manager, Runtime,
    plugin::{Builder, TauriPlugin},
};
use tauri_plugin_shell::process::CommandChild;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("sidecars")
        .invoke_handler(tauri::generate_handler![
            commands::start_sidecar,
            commands::shutdown_sidecar,
        ])
        .setup(|app, _| {
            app.manage(Arc::new(Mutex::new(None::<CommandChild>)));
            let app_handle = app.app_handle().clone();
            commands::spawn_and_monitor_sidecar(app_handle)?;
            Ok(())
        })
        .on_event(|app, event| match event {
            tauri::RunEvent::ExitRequested { .. } => despawn_sidecar(app),
            _ => {}
        })
        .build()
}
