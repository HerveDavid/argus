use crate::powsybl::state::PowsyblState;
use crate::settings::state::SettingsState;

#[derive(Default)]
pub struct AppStateInner {
    pub settings: SettingsState,
    pub powsybl: PowsyblState,
}

pub type AppState = crossbeam::sync::ShardedLock<AppStateInner>;
