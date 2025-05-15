use crate::broker::state::BrokerState;
use crate::powsybl::state::PowsyblState;
use crate::settings::state::SettingsState;

#[derive(Default)]
pub struct AppStateInner {
    pub settings: SettingsState,
    pub powsybl: PowsyblState,
    pub broker: BrokerState,
}

pub type AppState = crossbeam::sync::ShardedLock<AppStateInner>;
