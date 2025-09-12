use std::sync::Arc;

use async_nats::Client;
use bevy::prelude::*;
use futures::StreamExt;
use tokio::{
    sync::mpsc::{self, UnboundedReceiver, UnboundedSender},
    task::JoinHandle,
};

use crate::{nats::resources::NatsClient, tokio::resource::AsyncRt};

use super::events::TimeEvent;

const TOPIC: &str = "GameMaster";

#[derive(Resource)]
pub struct GameMasterConfig {
    pub topic: &'static str,
    pub receiver: UnboundedReceiver<TimeEvent>,
    time_listener: JoinHandle<()>,
}

impl Drop for GameMasterConfig {
    fn drop(&mut self) {
        self.time_listener.abort()
    }
}

impl FromWorld for GameMasterConfig {
    fn from_world(world: &mut World) -> Self {
        let runtime = world.resource::<AsyncRt>();
        let nats = world.resource::<NatsClient>();

        let client = nats.client.clone();
        let (sender, receiver) = mpsc::unbounded_channel::<TimeEvent>();

        let time_listener = runtime.handle.spawn(async {
            if let Err(err) = create_time_listener(client, sender).await {
                eprintln!("❌ Erreur TIME listener: {}", err);
            }
        });

        Self {
            topic: TOPIC,
            receiver,
            time_listener,
        }
    }
}

async fn create_time_listener(
    client: Arc<Client>,
    sender: UnboundedSender<TimeEvent>,
) -> Result<()> {
    let mut subscriber = client.subscribe("time").await.unwrap();

    while let Some(msg) = subscriber.next().await {
        let topic = msg.subject.to_string();
        let payload = &msg.payload;

        match std::str::from_utf8(payload) {
            Ok(payload_str) => sender.send(TimeEvent::from(payload_str)).unwrap(),
            Err(err) => eprintln!("Err in {}: {}", topic, err),
        };
    }

    Ok(())
}
