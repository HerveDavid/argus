use std::collections::HashMap;

use serde::{Deserialize, Serialize};

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

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryCurves {
    pub curves: TelemetryData,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryData {
    pub values: HashMap<String, f64>,
    pub time: u64,
}
