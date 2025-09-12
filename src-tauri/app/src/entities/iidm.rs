use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct Substation {
    pub id: String,
    pub name: String,
    pub country: String,
    pub geo_tags: String,
    pub tso: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct Substations {
    pub substations: Vec<Substation>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct VoltageLevel {
    pub id: String,
    pub nominal_v: f64,
    pub topology_kind: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct VoltageLevels {
    pub voltage_levels: Vec<VoltageLevel>,
}
