use std::sync::Arc;

use bevy::prelude::*;
use tokio::sync::mpsc::UnboundedReceiver;

use super::events::TauriEvent;

#[derive(Resource)]
pub struct TauriResource {
    pub receiver: Arc<tokio::sync::Mutex<UnboundedReceiver<TauriEvent>>>,
}

impl TauriResource {
    pub fn new(receiver: Arc<tokio::sync::Mutex<UnboundedReceiver<TauriEvent>>>) -> Self {
        Self { receiver }
    }
}
