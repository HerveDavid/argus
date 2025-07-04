use super::error::{Error, Result};

use crate::entities::sld_metadata::SldMetadata;
use crate::utils::tasks::CancellableTask;

use futures::stream::StreamExt;
use log::{debug, info, warn};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::{collections::HashMap, time::Duration};

pub struct FeedersState {
    // Stocke maintenant un tuple (paused_flag, task) pour chaque souscription
    pub subscriptions: HashMap<String, (Arc<AtomicBool>, CancellableTask<()>)>,
}

impl FeedersState {
    pub async fn new() -> Result<tokio::sync::Mutex<Self>> {
        let state = Self {
            subscriptions: Default::default(),
        };

        Ok(tokio::sync::Mutex::new(state))
    }

    pub fn has_subscription(&self, id: &str) -> bool {
        self.subscriptions.contains_key(id)
    }

    pub async fn start_feeder(
        &mut self,
        id: String,
        metadata: SldMetadata,
        nats_client: Arc<async_nats::Client>,
    ) -> Result<()> {
        // Check if subscription already exists
        if self.has_subscription(&id) {
            info!("Subscription already exists for feeder '{}'", id);
            return Ok(());
        }

        // Create the topic name using the id (same as GameMaster pattern)
        let topic = format!("GameMaster.{}", id.replace(".", "_"));

        info!(
            "Starting feeder subscription for '{}' on topic '{}'",
            id, topic
        );

        // Créer le flag de pause partagé
        let paused = Arc::new(AtomicBool::new(false));
        let paused_clone = paused.clone();

        // Create cancellable task for this subscription
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

        // Store the task and pause flag in the feeders state
        self.subscriptions.insert(id.clone(), (paused, task));

        info!("Feeder '{}' started successfully", id);
        Ok(())
    }

    pub async fn pause_feeder(&mut self, id: &str) -> Result<()> {
        match self.subscriptions.get(id) {
            Some((paused, _)) => {
                let was_running = !paused.swap(true, Ordering::Relaxed);
                if was_running {
                    info!("Paused feeder '{}'", id);
                    Ok(())
                } else {
                    warn!("Feeder '{}' was already paused", id);
                    // Vous pouvez retourner une erreur ou simplement Ok(()) selon votre logique
                    Ok(())
                }
            }
            None => {
                warn!("Attempted to pause non-existent feeder '{}'", id);
                Err(Error::FeederNotFound(id.to_string()))
            }
        }
    }

    pub async fn resume_feeder(&mut self, id: &str) -> Result<()> {
        match self.subscriptions.get(id) {
            Some((paused, _)) => {
                let was_paused = paused.swap(false, Ordering::Relaxed);
                if was_paused {
                    info!("Resumed feeder '{}'", id);
                    Ok(())
                } else {
                    warn!("Feeder '{}' was already running", id);
                    // Vous pouvez retourner une erreur ou simplement Ok(()) selon votre logique
                    Ok(())
                }
            }
            None => {
                warn!("Attempted to resume non-existent feeder '{}'", id);
                Err(Error::FeederNotFound(id.to_string()))
            }
        }
    }

    pub fn is_feeder_paused(&self, id: &str) -> Option<bool> {
        self.subscriptions
            .get(id)
            .map(|(paused, _)| paused.load(Ordering::Relaxed))
    }

    pub async fn close_feeder(&mut self, id: &str) -> Result<()> {
        if let Some((_, mut task)) = self.subscriptions.remove(id) {
            info!("Closing feeder subscription for '{}'", id);

            // Cancel the task
            task.cancel();

            // Wait for the task to complete with a timeout
            match tokio::time::timeout(Duration::from_secs(5), task.join()).await {
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

    pub fn list_active_feeders(&self) -> Vec<String> {
        self.subscriptions.keys().cloned().collect()
    }

    pub fn feeder_count(&self) -> usize {
        self.subscriptions.len()
    }

    // Nouvelle méthode pour obtenir le statut complet des feeders
    pub fn get_feeders_status(&self) -> HashMap<String, bool> {
        self.subscriptions
            .iter()
            .map(|(id, (paused, _))| (id.clone(), paused.load(Ordering::Relaxed)))
            .collect()
    }
}
