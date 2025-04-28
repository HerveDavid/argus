use crate::powsybl::state::PowsyblState;

#[derive(Default)]
pub struct AppStateInner {
    pub powsybl: PowsyblState,
}

pub type AppState = crossbeam::sync::ShardedLock<AppStateInner>;
