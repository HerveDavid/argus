use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TsTmMessage {
    pub id: String,
    pub tase2: String,
    pub cause: String,
    pub validity: String,
    #[serde(rename = "operatorBlocked")]
    pub operator_blocked: String,
    pub ts: i64,
    pub tfos: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    #[serde(rename = "stVal")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub st_val: Option<i32>,
}
