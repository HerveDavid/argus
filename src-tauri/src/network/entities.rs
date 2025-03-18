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
pub struct VoltageLevel {
    pub high_voltage_limit: Option<f64>,
    pub id: String,
    pub low_voltage_limit: Option<f64>,
    pub name: String,
    pub nominal_v: f64,
    pub substation_id: String,
    pub topology_kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Substations {
    pub substations: Vec<Substation>,
}
