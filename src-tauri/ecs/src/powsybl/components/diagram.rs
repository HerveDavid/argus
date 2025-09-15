use bevy::prelude::*;
use serde::Serialize;
use tauri::ipc::Channel;

#[derive(Component)]
pub struct SingleLineDiagram {
    pub id: String,
    pub channel: Channel<DiagramEvent>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "tag", content = "content")]
pub enum DiagramEvent {
    FeederUpdate { feeders: Vec<(String, f64)> },
}
