use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use super::entities::{FeederActionResponse, FeederStatus};
use super::error::{Error, Result};

use crate::nats::state::NatsState;
use crate::tasks::state::TasksState;
use crate::utils::tasks::CancellableTask;

use futures::StreamExt;
use log::{debug, info, warn};
use serde_json::json;
use tauri::ipc::Channel;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn add_nats_feeder(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    id: String,
    channel: Channel<serde_json::Value>,
) -> Result<FeederActionResponse> {
    // Get NATS client
    let nats_client = {
        let nats_state = nats_state.lock().await;
        nats_state.get_client().ok_or(Error::ClientNotInitialized)?
    };

    // Create the topic name using the id (same as GameMaster pattern)
    let topic = format!("GameMaster.{}", id.replace(".", "_"));

    info!("Adding NATS feeder '{}' for topic '{}'", id, topic);

    // Flag for pausing feeder
    let paused = Arc::new(AtomicBool::new(false));
    let paused_clone = paused.clone();

    // Create cancellable task for this NATS subscription
    let task = CancellableTask::new({
        let topic = topic.clone();
        let id = id.clone();
        let client = nats_client.clone();

        move |cancellation_token| async move {
            // Subscribe to the topic
            let mut subscription = match client.subscribe(topic.clone()).await {
                Ok(sub) => sub,
                Err(e) => {
                    warn!("Failed to subscribe to topic '{}': {}", topic, e);
                    return;
                }
            };

            info!(
                "Successfully subscribed to topic '{}' for feeder '{}'",
                topic, id
            );

            // Main message processing loop
            loop {
                tokio::select! {
                    // Handle incoming messages
                    Some(msg) = subscription.next() => {
                        // Vérifier si le feeder est en pause
                        if paused_clone.load(Ordering::Relaxed) {
                            debug!("Feeder '{}' is paused, skipping message", id);
                            continue;
                        }

                        debug!("Message received on '{}': {:?}", topic, &msg.payload);

                        // Process the message here based on your needs
                        if let Ok(payload) = std::str::from_utf8(&msg.payload) {
                            debug!("Feeder '{}' received: {}", id, payload);

                            let event = json!({
                                payload: payload
                            });

                            if let Err(e) = channel.send(event) {
                                log::warn!("Failed to send event to channel '{}': {:?}", id, e);
                            }

                        }
                    }

                    // Handle cancellation
                    _ = cancellation_token.cancelled() => {
                        info!("Cancellation received for feeder '{}'", id);
                        break;
                    }
                }
            }

            info!("Feeder subscription task terminated for '{}'", id);
        }
    });

    // Add the feeder to the state
    let mut tasks_state = tasks_state.lock().await;

    match tasks_state.add_task(id.clone(), task) {
        Ok(()) => {
            let feeder_status = FeederStatus::new(id.clone(), false, Some(false)); // false = not started yet
            Ok(FeederActionResponse {
                success: true,
                message: format!("NATS feeder '{}' added successfully", id),
                feeder_status: Some(feeder_status),
            })
        }
        Err(e) => Err(Error::FeederError(e)),
    }
}
