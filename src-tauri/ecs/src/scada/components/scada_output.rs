use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScadaOutputResponse {
    pub success: bool,
    #[serde(rename = "data")]
    pub outputs: Vec<ScadaOutput>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(rename = "row_count")]
    pub row_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Component)]
pub struct ScadaOutput {
    pub id: String,
    pub dynawo_id: String,
    pub tase2: String,
    pub source: String,
    pub destination: String,
    pub topic: String,
    pub graphical_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub publish_on_change: Option<bool>,
}
