use std::collections::HashMap;

use super::entities::{Substation, VoltageLevel};

#[derive(Debug, Default)]
pub struct NetworkState {
    pub substations: HashMap<String, Substation>,
    pub voltage_levels: HashMap<String, VoltageLevel>,
}
