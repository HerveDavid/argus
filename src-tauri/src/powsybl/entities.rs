use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfoResponse {
    pub table_name: String,
    pub exists: bool,
    pub row_count: i32,
    pub columns: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResponse {
    pub success: bool,
    pub data: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub error: Option<String>,
    pub row_count: Option<i32>,
    pub columns: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SQLQueryRequest {
    pub query: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<Vec<serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SingleLineDiagramResponse {
    pub success: bool,
    pub svg_content: Option<String>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    pub error: Option<String>,
    pub element_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkAreaDiagramResponse {
    pub success: bool,
    pub svg_content: Option<String>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    pub error: Option<String>,
    pub voltage_level_ids: Option<serde_json::Value>, // Can be string, array, or null
    pub depth: Option<i32>,
    pub high_nominal_voltage_bound: Option<f64>,
    pub low_nominal_voltage_bound: Option<f64>,
}
