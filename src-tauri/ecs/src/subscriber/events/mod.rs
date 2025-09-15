use bevy::prelude::*;
use tauri::ipc::Channel;

use crate::powsybl::components::DiagramEvent;

#[derive(Event)]
pub struct SubscriptionEvent(pub String, pub Entity, pub Channel<DiagramEvent>);
