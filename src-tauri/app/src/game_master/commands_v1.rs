use std::sync::atomic::AtomicBool;
use std::sync::Arc;

use crate::entities::sld_metadata::SldMetadata;
use crate::nats::state::NatsState;
use crate::sessions::state::SessionState;
use crate::tasks::state::TasksState;

use super::entities::{ScadaMessage, ScadaOutput};
use super::error::{Error, Result};
use super::state::*;
use super::utils;

use tauri::ipc::Channel;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_game_master_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    metadata: SldMetadata,
    channel: Channel<ScadaMessage>,
) -> Result<Vec<ScadaOutput>> {
    let session_client = session_state.lock().await;
    let outputs = utils::get_scada_outputs(session_client, metadata).await?;

    if outputs.is_empty() {
        return Err(Error::OutputsEmpty);
    }

    // Get NATS client
    let nats_client = {
        let nats_state = nats_state.lock().await;
        match nats_state.get_client() {
            Some(client) => {
                log::info!("NATS client acquired successfully");
                client
            }
            None => {
                log::error!("NATS client not initialized");
                return Err(Error::ClientNotInitialized);
            }
        }
    };

    for output in outputs.clone() {
        let id = output.id.clone();
        let paused = Arc::new(AtomicBool::new(false));
        let task = utils::create_task_feeder(nats_client.clone(), channel.clone(), output, paused);
        tasks_state.lock().await.add_task(id, task)?;
    }

    Ok(outputs)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_game_master_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    outputs: Vec<ScadaOutput>,
) -> Result<bool> {
    let mut tasks_guard = tasks_state.lock().await;
    for output in outputs {
        tasks_guard.close_task(&output.id).await?;
    }

    Ok(true)
}