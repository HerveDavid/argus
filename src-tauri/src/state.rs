use crate::network::state::NetworkState;
use crate::settings::state::SettingsState;

#[derive(Debug, Default)]
pub struct AppStateInner {
    pub settings: SettingsState,
    pub network: NetworkState,
}

pub type AppState = std::sync::Mutex<AppStateInner>;
