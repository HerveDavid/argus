use state::SldState;
use tauri::{
    Manager, Runtime,
    plugin::{Builder, TauriPlugin},
};

mod commands;
mod entities;
mod entry;
mod errors;
mod state;
mod utils;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("diagrams")
        .invoke_handler(tauri::generate_handler![
            commands::subscribe_diagram,
            commands::unsubscribe_diagram,
        ])
        .setup(|app, _| {
            app.manage(SldState::default());
            Ok(())
        })
        .build()
}
