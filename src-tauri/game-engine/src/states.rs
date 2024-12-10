use bevy::prelude::Resource;

#[derive(Default, Resource)]
pub struct EngineState {
    pub is_running: bool,
    pub is_pause: bool,
}