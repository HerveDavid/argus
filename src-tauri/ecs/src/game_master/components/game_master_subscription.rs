use bevy::prelude::*;
use tokio::{sync::mpsc::UnboundedReceiver, task::JoinHandle};

use crate::nats::events::NatsEvent;

#[derive(Debug, Component)]
pub struct GameMasterSubscription {
    #[allow(dead_code)]
    pub topic: String,

    pub receiver: UnboundedReceiver<NatsEvent>,
    pub listener: JoinHandle<()>,
}

impl Drop for GameMasterSubscription {
    fn drop(&mut self) {
        self.listener.abort();
    }
}
