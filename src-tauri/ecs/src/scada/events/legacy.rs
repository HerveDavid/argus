use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegacyMessage {
    pub id: String,
    pub value: f64,
    pub time_sent: f64,
    pub time_received: f64,
}
