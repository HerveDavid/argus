use std::sync::Arc;

use bevy::prelude::Event;
use futures::StreamExt;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::nats::state::NatsState;
use crate::tasks::state::TasksState;
use crate::utils::tasks::CancellableTask;

use super::error::{Error, Result};
use super::{scada::BrokerClient, state::EcsState};

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    pub id: String,
    pub dynawo_id: String,
    pub tase2: String,
    pub source: String,
    pub destination: String,
    pub topic: String,
    pub graphical_id: String,
    pub publish_on_change: Option<bool>,
}

#[derive(Event)]
pub struct IncomingEvent {
    value: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_output_scada(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    ecs_state: State<'_, Arc<tokio::sync::Mutex<EcsState>>>,
    output: Output,
) -> Result<()> {
    let nats = nats_state.lock().await;

    if !nats.get_status().connected {
        return Err(Error::BrokerNotConnected);
    }

    let client = nats.get_client().ok_or(Error::ClientNotInitialized)?;
    let ecs = ecs_state.inner().clone();

    let task = CancellableTask::new({
        let id = output.id.clone();
        let destination = output.destination.clone();
        let local_topic = output.topic.clone();
        let sanitized_topic = local_topic.replace(".", "_");

        // Create full topic: HMI.<destination>.<sanitized_topic>
        let full_topic = format!("HMI.{}.{}", destination, sanitized_topic);

        move |cancellation_token| async move {
            // Subscribe to the topic
            let mut subscription = match client.subscribe(full_topic.clone()).await {
                Ok(sub) => sub,
                Err(e) => {
                    error!("Failed to subscribe to topic '{}': {}", full_topic, e);
                    return;
                }
            };

            loop {
                tokio::select! {
                    Some(msg) = subscription.next() => {
                        match std::str::from_utf8(&msg.payload) {
                            Ok(payload_str) => {
                                let mut guard = ecs.lock().await;
                                guard.send(IncomingEvent { value: payload_str.to_string()});
                                guard.update();
                            }
                            Err(e) => {}
                        }
                    }
                    _ = cancellation_token.cancelled() => {
                        break
                    }
                }
            }
        }
    });

    tasks_state.lock().await.add_task(output.id, task).unwrap();
    Ok(())
}
