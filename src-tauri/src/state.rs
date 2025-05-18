use tauri::AppHandle;

use crate::powsybl::state::PowsyblState;
use crate::settings::state::SettingsState;

pub struct AppStateInner {
    pub settings: SettingsState,
    pub powsybl: PowsyblState,
}

pub type AppState = crossbeam::sync::ShardedLock<AppStateInner>;

impl AppStateInner {
    pub async fn new(app_handle: &AppHandle) -> anyhow::Result<AppState> {
        let settings = SettingsState::default();
        let powsybl = PowsyblState::default();

        let state = crossbeam::sync::ShardedLock::new(AppStateInner { settings, powsybl });

        Ok(state)
    }
}
