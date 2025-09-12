use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::entities::sld_metadata::SldMetadata;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    #[serde(rename = "configPath")]
    pub config_path: String,
    #[serde(rename = "lastAccessed")]
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub tables: i64,
    pub total_size: i64,
    pub table_stats: Vec<(String, i64)>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResponse {
    pub columns: Vec<String>,
    pub data: Vec<serde_json::Value>,
    pub row_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PythonRequest {
    #[serde(rename = "type")]
    pub request_type: String,
    pub id: String,
    pub method: String,
    pub params: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PythonResponse {
    #[serde(rename = "type")]
    pub response_type: String,
    pub id: String,
    pub status: u16,
    pub result: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub file_path: String,
    pub network_id: String,
    pub buses_count: usize,
    pub lines_count: usize,
    pub generators_count: usize,
    pub loads_count: usize,
}

#[derive(Serialize, Deserialize)]
pub struct DiagramResult {
    pub svg: String,
    pub metadata: SldMetadata,
}
