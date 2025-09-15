use std::collections::HashMap;

use bevy::prelude::*;

#[derive(Resource)]
pub struct SubscriberManager {
    pub substations: HashMap<String, Entity>,
}

impl Default for SubscriberManager {
    fn default() -> Self {
        let substations = HashMap::new();

        Self { substations }
    }
}
