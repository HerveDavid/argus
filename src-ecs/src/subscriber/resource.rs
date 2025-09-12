use std::collections::HashSet;

use bevy::prelude::*;

#[derive(Resource)]
pub struct SubscriberManager {
    pub substations: HashSet<String>,
}

impl Default for SubscriberManager {
    fn default() -> Self {
        let mut substations = HashSet::new();

        substations.insert("MQIS".to_string());
        substations.insert(".A.ZA 6".to_string());
        substations.insert(".A.ZA".to_string());

        Self { substations }
    }
}
