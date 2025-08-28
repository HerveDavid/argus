use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ScadaQuery {
    pub query: String,
    pub parameters: Vec<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct QueryResponse {
    pub success: bool,
    pub data: Vec<ScadaOutput>,
    pub error: Option<String>,
    pub row_count: u32,
    pub columns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScadaOutput {
    pub id: String,
    pub dynawo_id: String,
    pub tase2: String,
    pub source: String,
    pub destination: String,
    pub topic: String,
    pub graphical_id: String,
    pub publish_on_change: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Event)]
#[serde(untagged)]
pub enum ScadaMessage {
    TsTm(TsTmMessage),
    Legacy(LegacyMessage),
    Fallback(FallbackMessage),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TsTmMessage {
    pub id: String,
    pub dynawo_id: String,
    pub format: String, // Always "TS_TM"
    pub tase2: String,
    pub graphical_id: String,
    pub timestamp: u64,
    pub cause: String,
    pub validity: String,
    pub operator_blocked: bool,
    #[serde(rename = "type")]
    pub message_type: String, // "TS" or "TM"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "stVal")]
    pub st_val: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tfos: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegacyMessage {
    pub id: String,
    pub dynawo_id: String,
    pub graphical_id: String,
    pub format: String, // Always "Legacy"

    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_sent: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_received: Option<f64>,
    pub raw_message: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FallbackMessage {
    pub id: String,
    pub raw_payload: String,
    pub parse_error: String,
}
