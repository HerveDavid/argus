use serde::{Deserialize, Serialize};

use crate::network::entities::{Substation, VoltageLevel};


#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct AppStateInner {
    pub substations: Vec<Substation>,
    pub voltage_levels: Vec<VoltageLevel>,
}

pub type AppState = std::sync::Mutex<AppStateInner>;
