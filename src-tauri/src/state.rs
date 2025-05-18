use tauri::AppHandle;

use crate::database::Database;
use crate::powsybl::state::PowsyblState;
use crate::settings::state::SettingsState;

pub struct AppStateInner {
    pub settings: SettingsState,
    pub powsybl: PowsyblState,
    pub database: Database,
}

pub type AppState = crossbeam::sync::ShardedLock<AppStateInner>;

impl AppStateInner {
    pub async fn new(app_handle: &AppHandle) -> anyhow::Result<AppState> {
        let settings = SettingsState::default();
        let powsybl = PowsyblState::default();
        let database = Database::new(app_handle).await?;

        let state = crossbeam::sync::ShardedLock::new(AppStateInner {
            settings,
            powsybl,
            database,
        });

        Ok(state)
    }
}
