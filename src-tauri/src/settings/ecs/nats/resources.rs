use std::sync::Arc;

use async_nats::Client;
use bevy::prelude::*;
use futures::StreamExt;
use tokio::{runtime::Handle, sync::mpsc::UnboundedSender, task::JoinHandle};

use crate::settings::ecs::tokio::resource::AsyncRt;

use super::{error::Result, events::NatsEvent};

const NATS_URL: &str = "nats://localhost:4222";

#[derive(Resource)]
pub struct NatsClient {
    pub client: Arc<Client>,
    handle: Handle,
}

impl FromWorld for NatsClient {
    fn from_world(world: &mut World) -> Self {
        let runtime = world.resource::<AsyncRt>();

        let handle = runtime.handle.clone();
        let client = handle.block_on(async {
            create_client(NATS_URL)
                .await
                .expect("Impossible to connect to NATS server")
        });

        Self { client, handle }
    }
}

impl NatsClient {
    pub fn create_listener_task(
        &self,
        topic: String,
        sender: UnboundedSender<NatsEvent>,
    ) -> Result<JoinHandle<()>> {
        let client = self.client.clone();
        let task = self.handle.spawn(async move {
            if let Err(e) = create_listener_task(client, topic.clone(), sender).await {
                eprintln!("❌ Error Task create listener: {}", e);
            }
        });

        Ok(task)
    }
}

async fn create_client(url: &str) -> Result<Arc<Client>> {
    let client = async_nats::connect(url).await?;
    Ok(Arc::new(client))
}

async fn create_listener_task(
    client: Arc<Client>,
    topic: String,
    sender: UnboundedSender<NatsEvent>,
) -> Result<()> {
    let mut subscriber = client.subscribe(topic).await?;

    while let Some(msg) = subscriber.next().await {
        let topic = msg.subject.to_string();
        let payload = &msg.payload;

        match std::str::from_utf8(payload) {
            Ok(payload_str) => sender
                .send(NatsEvent {
                    topic: topic.clone(),
                    payload: payload_str.to_string(),
                })
                .unwrap(),
            Err(err) => eprintln!("Err in {}: {}", topic, err),
        };
    }

    Ok(())
}
