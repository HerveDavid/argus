use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GameMasterOutput {
    pub id: String,

    #[serde(rename = "dynawo_id")]
    pub dynawo_id: String,

    pub topic: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub graphical_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub equipment_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub side: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none", rename = "componentType")]
    pub component_type: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct GameMasterOutputs {
    pub data: Vec<GameMasterOutput>,
}
