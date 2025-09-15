use bevy::prelude::*;
use std::sync::Arc;
use tokio::sync::mpsc::UnboundedReceiver;

use super::{events::TauriEvent, resources::TauriResource, systems::dispatch_tauri_event};

pub struct TauriPlugin {
    receiver: Arc<tokio::sync::Mutex<UnboundedReceiver<TauriEvent>>>,
}

impl TauriPlugin {
    pub fn new(receiver: UnboundedReceiver<TauriEvent>) -> Self {
        Self {
            receiver: Arc::new(tokio::sync::Mutex::new(receiver)),
        }
    }
}

impl Plugin for TauriPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(TauriResource::new(self.receiver.clone()));
        app.add_event::<TauriEvent>();
        app.add_systems(Update, dispatch_tauri_event);
    }
}
