use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use chrono::{DateTime, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};
use tokio::time::{sleep, Duration};

use crate::utils::tasks::CancellableTask;

use super::error::{Error, Result};
use super::state::Channels;

#[derive(Debug, Serialize, Deserialize)]
pub struct Event {
    id: String,
    value: f64,
    timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ChannelStatus {
    id: String,
    exists: bool,
    paused: Option<bool>,
}

fn generate_random_float() -> f64 {
    let mut rng = rand::thread_rng();

    let int_value = rng.gen_range(-100000..=100000);
    int_value as f64 / 10000.0
}

#[tauri::command]
pub async fn register(
    state: State<'_, Channels>,
    id: String,
    channel: Channel<Event>,
) -> Result<()> {
    let mut channels = state.lock().await;

    if channels.channels.contains_key(&id) {
        return Err(Error::ChannelAlreadyExists { id });
    }

    let paused = Arc::new(AtomicBool::new(false));
    let paused_clone = paused.clone();
    let id_clone = id.clone();
    let channel_clone = channel.clone();

    let task = CancellableTask::new(move |token| {
        let id = id_clone;
        let channel = channel_clone;
        let paused = paused_clone.clone();

        async move {
            loop {
                tokio::select! {
                    _ = sleep(Duration::from_millis(10)) => {
                        if paused.load(Ordering::Relaxed) {
                            continue;
                        }

                        let value = generate_random_float();
                        let event = Event {
                            id: id.clone(),
                            value,
                            timestamp: Utc::now(),
                        };

                        if let Err(e) = channel.send(event) {
                            log::warn!("Failed to send event to channel '{}': {:?}", id, e);
                            break;
                        }

                        log::info!("Sent to {} - value: {}", id, value);
                    }
                    _ = token.cancelled() => {
                        log::info!("Task for channel '{}' was cancelled", id);
                        break;
                    }
                }
            }
        }
    });

    channels.channels.insert(id, (paused, task));
    log::info!("Successfully registered channel");

    Ok(())
}

#[tauri::command]
pub async fn unregister(state: State<'_, Channels>, id: String) -> Result<()> {
    let mut channels = state.lock().await;

    match channels.channels.remove(&id) {
        Some((_, task)) => {
            task.cancel();
            log::info!("Successfully unregistered channel '{}'", id);
            Ok(())
        }
        None => {
            log::warn!("Attempted to unregister non-existent channel '{}'", id);
            Err(Error::ChannelNotFound { id })
        }
    }
}

#[tauri::command]
pub async fn start(state: State<'_, Channels>, id: String) -> Result<()> {
    let channels = state.lock().await;

    match channels.channels.get(&id) {
        Some((paused, _)) => {
            let was_paused = paused.swap(false, Ordering::Relaxed);
            if was_paused {
                log::info!("Started channel '{}'", id);
                Ok(())
            } else {
                log::warn!("Channel '{}' was already running", id);
                Err(Error::InvalidStateTransition { id })
            }
        }
        None => {
            log::warn!("Attempted to start non-existent channel '{}'", id);
            Err(Error::ChannelNotFound { id })
        }
    }
}

#[tauri::command]
pub async fn stop(state: State<'_, Channels>, id: String) -> Result<()> {
    let mut channels = state.lock().await;

    match channels.channels.remove(&id) {
        Some((_, task)) => {
            task.cancel();
            log::info!("Successfully stopped channel '{}'", id);
            Ok(())
        }
        None => {
            log::warn!("Attempted to stop non-existent channel '{}'", id);
            Err(Error::ChannelNotFound { id })
        }
    }
}

#[tauri::command]
pub async fn pause(state: State<'_, Channels>, id: String) -> Result<()> {
    let channels = state.lock().await;

    match channels.channels.get(&id) {
        Some((paused, _)) => {
            let was_running = !paused.swap(true, Ordering::Relaxed);
            if was_running {
                log::info!("Paused channel '{}'", id);
                Ok(())
            } else {
                log::warn!("Channel '{}' was already paused", id);
                Err(Error::InvalidStateTransition { id })
            }
        }
        None => {
            log::warn!("Attempted to pause non-existent channel '{}'", id);
            Err(Error::ChannelNotFound { id })
        }
    }
}

#[tauri::command]
pub async fn get_status(state: State<'_, Channels>, id: String) -> Result<ChannelStatus> {
    let channels = state.lock().await;

    match channels.channels.get(&id) {
        Some((paused, _)) => Ok(ChannelStatus {
            id,
            exists: true,
            paused: Some(paused.load(Ordering::Relaxed)),
        }),
        None => Ok(ChannelStatus {
            id,
            exists: false,
            paused: None,
        }),
    }
}

#[tauri::command]
pub async fn list_channels(state: State<'_, Channels>) -> Result<Vec<ChannelStatus>> {
    let channels = state.lock().await;

    let statuses: Vec<ChannelStatus> = channels
        .channels
        .iter()
        .map(|(id, (paused, _))| ChannelStatus {
            id: id.clone(),
            exists: true,
            paused: Some(paused.load(Ordering::Relaxed)),
        })
        .collect();

    Ok(statuses)
}
