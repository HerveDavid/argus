use bevy::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Event, Debug, Deserialize, Serialize)]
pub struct MeasureEvent {
    #[serde(flatten)]
    pub values: HashMap<String, f64>,
}

impl From<&str> for MeasureEvent {
    fn from(s: &str) -> Self {
        serde_json::from_str(s).expect("Impossible to convert measurement")
    }
}
