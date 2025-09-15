use bevy::prelude::*;
use tauri::ipc::Channel;

use crate::{mode::resources::Kind, powsybl::components::DiagramEvent};

#[derive(Event)]
pub enum TauriEvent {
    // Configuration
    SwitchMode {
        kind: Kind,
    },
    // Powsybl
    Subscribe {
        element_id: String,
        channel: Channel<DiagramEvent>,
    },

    Unubscribe {
        element_id: String,
    },
}
