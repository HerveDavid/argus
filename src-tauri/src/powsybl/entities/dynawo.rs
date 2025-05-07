use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Default, Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryCurves {
    pub curves: TelemetryData,
}

#[derive(Default, Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryData {
    pub values: HashMap<String, f64>,
    pub time: u64,
}
