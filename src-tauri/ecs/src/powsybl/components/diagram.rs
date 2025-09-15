use bevy::prelude::*;
use tauri::ipc::Channel;

#[derive(Component)]
pub struct SingleLineDiagram {
    pub id: String,
    pub channel: Channel<String>,
}
