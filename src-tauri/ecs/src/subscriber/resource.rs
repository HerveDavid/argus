use std::collections::HashMap;

use bevy::prelude::*;
use tauri::ipc::Channel;

use crate::powsybl::components::DiagramEvent;

#[derive(Resource)]
pub struct SubscriberManager {
    pub substations: HashMap<String, (Entity, Channel<DiagramEvent>)>,
}

impl Default for SubscriberManager {
    fn default() -> Self {
        let substations = HashMap::new();

        Self { substations }
    }
}
