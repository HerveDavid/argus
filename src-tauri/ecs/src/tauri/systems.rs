use bevy::prelude::*;

use super::{events::TauriEvent, resources::TauriResource};

pub fn dispatch_tauri_event(
    tauri_res: ResMut<TauriResource>,
    mut event_writer: EventWriter<TauriEvent>,
) {
    if let Ok(mut receiver) = tauri_res.receiver.try_lock() {
        while let Ok(msg) = receiver.try_recv() {
            event_writer.write(msg);
            println!("Coucou");
        }
    }
}
