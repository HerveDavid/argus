// use state::SldState;
// use tauri::{
//     Manager, Runtime,
//     plugin::{Builder, TauriPlugin},
// };

mod entities;
mod entry;
mod errors;
mod utils;

pub mod commands;
pub mod state;

// pub fn init<R: Runtime>() -> TauriPlugin<R> {
//     Builder::<R>::new("diagrams")
//         .invoke_handler(tauri::generate_handler![
//             commands::subscribe_diagram,
//             commands::unsubscribe_diagram,
//             commands::update_feeders,
//             commands::update_events,
//             commands::event_open_breaker,
//             commands::event_close_breaker,
//         ])
//         .setup(|app, _| {
//             app.manage(SldState::default());
//             Ok(())
//         })
//         .build()
// }
