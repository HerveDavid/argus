use serde::{Deserialize, Serialize};

use crate::network::entities::Substation;

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
pub struct AppStateInner {
    pub substations: Vec<Substation>,
    pub voltage_levels: Vec<VoltageLevel>,
}

pub type AppState = std::sync::Mutex<AppStateInner>;
