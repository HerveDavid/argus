use bevy::prelude::*;
use tauri::ipc::Channel;

use crate::mode::resources::Kind;

#[derive(Event)]
pub enum TauriEvent {
    // Configuration
    SwitchMode {
        kind: Kind,
    },
    // Powsybl
    Subscribe {
        element_id: String,
        channel: Channel<String>,
    },

    Unubscribe {
        element_id: String,
    },
}
