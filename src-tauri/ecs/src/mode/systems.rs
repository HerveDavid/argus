use bevy::prelude::*;

use crate::tauri::events::TauriEvent;

use super::resources::Mode;

pub fn handle_switch_mode(mut tauri_events: EventReader<TauriEvent>, mut mode: ResMut<Mode>) {
    for event in tauri_events.read() {
        if let TauriEvent::SwitchMode { kind } = event {
            println!("{:?}", kind);
            mode.kind = *kind;
        }
    }
}
