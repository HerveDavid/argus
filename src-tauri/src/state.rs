use crate::network::entities::{Substation, VoltageLevel};

#[derive(Debug, Default)]
pub struct AppStateInner {
    pub client: tauri_plugin_http::reqwest::Client,
    pub substations: Vec<Substation>,
    pub voltage_levels: Vec<VoltageLevel>,
}

pub type AppState = std::sync::Mutex<AppStateInner>;
