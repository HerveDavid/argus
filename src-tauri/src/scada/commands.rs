use std::sync::atomic::Ordering;

use crate::entities::sld_metadata::SldMetadata;
use crate::feeders::entities::FeederStatus;
use crate::nats::state::NatsState;
use crate::sessions::state::SessionState;
use crate::tasks::state::TasksState;

use super::entities::ScadaOutput;
use super::error::{Error, Result};
use super::utils;

use log::info;
use tauri::ipc::Channel;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_scada_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    metadata: SldMetadata,
    channel: Channel<serde_json::Value>,
) -> Result<Vec<ScadaOutput>> {
    // Get session client
    let session_client = session_state.lock().await;

    // Get NATS client
    let nats_client = {
        let nats_state = nats_state.lock().await;
        nats_state.get_client().ok_or(Error::ClientNotInitialized)?
    };

    // Run a query in session to get SCADA outputs by graphical IDs
    let scada_outputs = utils::get_scada_outputs(session_client, metadata).await?;

    // Add the feeder to the state
    let mut tasks_state = tasks_state.lock().await;
    for scada_output in scada_outputs.clone() {
        let id = scada_output.id.clone();

        // Create cancellable task for this NATS subscription
        let task = utils::create_task_feeder(
            nats_client.clone(),
            channel.clone(),
            scada_output.clone(),
        );


        match tasks_state.add_task(id.clone(), task) {
            Ok(()) => {
                let feeder_status = FeederStatus::new(id.clone(), false, Some(true)); // false = not started yet
                info!("NATS feeder '{}' added successfully", id);
            }
            Err(e) => (),
        }
    }

    Ok(scada_outputs)
}
