use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct Substation {
    pub country: String,
    pub geo_tags: String,
    pub id: String,
    pub name: String,
    pub tso: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct Substations {
    pub substations: Vec<Substation>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct VoltageLevel {
    pub high_voltage_limit: Option<f64>,
    pub id: String,
    pub low_voltage_limit: Option<f64>,
    pub name: String,
    pub nominal_v: f64,
    pub substation_id: String,
    pub topology_kind: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct VoltageLevels {
    pub voltage_levels: Vec<VoltageLevel>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationParams {
    pub page: usize,
    pub per_page: usize,
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: 1,
            per_page: 20,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub items: T,
    pub total: usize,
    pub page: usize,
    pub per_page: usize,
    pub total_pages: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchStatus {
    pub success: bool,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct SldSubscriptionResponse {
    pub status: String,
}

#[derive(Clone, Serialize)]
#[serde(tag = "ti", content = "data")]
pub enum TeleInformation {
    TM { id: String, value: i32 },
}
