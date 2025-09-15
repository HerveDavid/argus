use bevy::prelude::*;
use tauri::ipc::Channel;

#[derive(Event)]
pub struct SubscriptionEvent(pub String, pub Entity, pub Channel<String>);
