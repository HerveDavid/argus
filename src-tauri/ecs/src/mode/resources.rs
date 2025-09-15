use bevy::prelude::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    GameMaster,
    Scada,
}

#[derive(Resource)]
pub struct Mode {
    pub kind: Kind,
}

impl Default for Mode {
    fn default() -> Self {
        Self {
            kind: Kind::GameMaster,
        }
    }
}
