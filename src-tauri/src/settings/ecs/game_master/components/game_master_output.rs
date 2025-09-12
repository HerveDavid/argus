use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMasterOutputsResponse {
    pub success: bool,
    #[serde(rename = "data")]
    pub outputs: Vec<GameMasterOutput>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(rename = "row_count")]
    pub row_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Component)]
pub struct GameMasterOutput {
    pub id: String,
    pub dynawo_id: String,
    pub model: String,
    pub variable: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_lib: Option<String>,
    pub equipment_id: String,
    pub kind: String,
    pub voltage_level: String,
    pub substation: String,
    pub graphical_id: String,
    pub iidm_class: String,
    pub topic: String,
}
