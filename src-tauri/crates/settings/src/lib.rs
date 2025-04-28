use state::SettingsState;
use tauri::{
    Manager, Runtime,
    plugin::{Builder, TauriPlugin},
};

pub mod entities;
pub mod errors;

mod state;
mod zmq;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("settings")
        .invoke_handler(tauri::generate_handler![zmq::set_zmq_url, zmq::get_zmq_url,])
        .setup(|app, _api| {
            app.manage(SettingsState::default());
            Ok(())
        })
        .build()
}
