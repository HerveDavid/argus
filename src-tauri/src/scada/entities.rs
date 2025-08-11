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