use std::collections::HashMap;

use bevy::prelude::*;
use tauri::ipc::Channel;

#[derive(Resource)]
pub struct SubscriberManager {
    pub substations: HashMap<String, (Entity, Channel<String>)>,
}

impl Default for SubscriberManager {
    fn default() -> Self {
        let substations = HashMap::new();

        Self { substations }
    }
}
