use super::error::Result;
use super::state::FeedersState;

use crate::entities::sld_metadata::SldMetadata;
use crate::nats::state::NatsState;
use crate::utils::tasks::CancellableTask;

use futures::stream::StreamExt;
use log::{debug, info, warn};
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn start_feeder_with_metatada(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    id: String,
    metadata: SldMetadata,
) -> Result<()> {
    let mut feeders_state = feeders_state.lock().await;

    // Check if subscription already exists
    if feeders_state.subscriptions.contains_key(&id) {
        info!("Subscription already exists for feeder '{}'", id);
        return Ok(());
    }

    // Get NATS client from state
    let nats_state = nats_state.lock().await;
    let client = match &nats_state.client {
        Some(client) => client.clone(),
        None => {
            warn!("NATS client not initialized");
            return Err(super::error::Error::ClientNotInitialized);
        }
    };
    drop(nats_state); // Release lock early

    // Create the topic name using the id (same as GameMaster pattern)
    let topic = format!("GameMaster.{}", id.replace(".", "_"));

    info!(
        "Starting feeder subscription for '{}' on topic '{}'",
        id, topic
    );

    // Create cancellable task for this subscription
    let task = CancellableTask::new({
        let topic = topic.clone();
        let id = id.clone();
        let client = client.clone();

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
                        debug!("Message received on '{}': {:?}", topic, &msg.payload);

                        // Process the message here based on your needs
                        if let Ok(payload) = std::str::from_utf8(&msg.payload) {
                            debug!("Feeder '{}' received: {}", id, payload);
                            // Add your message processing logic here
                            // You can use the metadata parameter for message processing
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

    // Store the task in the feeders state
    feeders_state.subscriptions.insert(id.clone(), task);

    info!("Feeder '{}' started successfully", id);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn close_feeder_with_metatada(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    id: String,
) -> Result<()> {
    let mut feeders_state = feeders_state.lock().await;

    if let Some(mut task) = feeders_state.subscriptions.remove(&id) {
        info!("Closing feeder subscription for '{}'", id);

        // Cancel the task
        task.cancel();

        // Wait for the task to complete with a timeout
        match tokio::time::timeout(std::time::Duration::from_secs(5), task.join()).await {
            Ok(Ok(_)) => {
                debug!("Feeder task '{}' terminated successfully", id);
            }
            Ok(Err(e)) => {
                warn!("Error while terminating feeder task '{}': {:?}", id, e);
            }
            Err(_) => {
                warn!(
                    "Timeout while waiting for feeder task '{}' to terminate",
                    id
                );
            }
        }

        info!("Feeder '{}' closed successfully", id);
    } else {
        debug!("No active subscription found for feeder '{}'", id);
    }

    Ok(())
}
