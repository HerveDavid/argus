use crate::entities::sld_metadata::SldMetadata;
use crate::nats::state::NatsState;
use crate::sessions::state::SessionState;
use crate::tasks::state::TasksState;

use super::entities::{ScadaMessage, ScadaOutput};
use super::error::{Error, Result};
use super::utils;

use tauri::ipc::Channel;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_scada_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    metadata: SldMetadata,
    channel: Channel<ScadaMessage>,
) -> Result<Vec<String>> {  // Retourne maintenant les IDs des feeders créés
    log::info!("Starting SCADA feeders subscription");

    // Debug: Log les métadonnées reçues
    log::info!("Received metadata: feeder_count={}", metadata.feeder_infos.len());

    // Get session client
    let session_client = session_state.lock().await;
    log::info!("Session client acquired");

    // Get NATS client
    let nats_client = {
        let nats_state = nats_state.lock().await;
        match nats_state.get_client() {
            Some(client) => {
                log::info!("NATS client acquired successfully");
                client
            },
            None => {
                log::error!("NATS client not initialized");
                return Err(Error::ClientNotInitialized);
            }
        }
    };

    // Run a query in session to get SCADA outputs by graphical IDs
    log::info!("Executing SCADA outputs query");
    let scada_outputs = match utils::get_scada_outputs(session_client, metadata).await {
        Ok(outputs) => {
            log::info!("Query successful, found {} SCADA outputs", outputs.len());
            outputs
        },
        Err(e) => {
            log::error!("Failed to get SCADA outputs: {:?}", e);
            return Err(e);
        }
    };

    let mut successful_feeder_ids = Vec::new();

    // Add the feeder to the state
    let mut tasks_state = tasks_state.lock().await;
    log::info!("Tasks state acquired, adding feeders");

    for scada_output in scada_outputs {
        let id = scada_output.id.clone();
        log::info!("Processing feeder: {}", id);

        match tasks_state.add_feeder_task(
            id.clone(),
            nats_client.clone(),
            channel.clone(),
            scada_output,
        ) {
            Ok(()) => {
                log::info!("NATS feeder '{}' added and started successfully", id);
                successful_feeder_ids.push(id);
            }
            Err(e) => {
                log::error!("Failed to add NATS feeder '{}': {:?}", id, e);
                // Continuer avec les autres feeders au lieu de tout arrêter
            }
        }
    }

    log::info!("Subscription completed: {}/{} feeders added successfully",
              successful_feeder_ids.len(), successful_feeder_ids.len());

    Ok(successful_feeder_ids)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_scada_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    feeder_ids: Vec<String>,
) -> Result<Vec<String>> {  // Retourne les IDs des feeders supprimés avec succès
    log::info!("Starting SCADA feeders unsubscription for {} feeders", feeder_ids.len());

    let mut tasks_state = tasks_state.lock().await;
    let mut successfully_removed = Vec::new();

    for feeder_id in feeder_ids {
        log::info!("Removing feeder: {}", feeder_id);

        match tasks_state.close_task(&feeder_id).await {
            Ok(()) => {
                log::info!("NATS feeder '{}' removed successfully", feeder_id);
                successfully_removed.push(feeder_id);
            }
            Err(e) => {
                log::error!("Failed to remove NATS feeder '{}': {:?}", feeder_id, e);
                // Continuer avec les autres feeders
            }
        }
    }

    log::info!("Unsubscription completed: {}/{} feeders removed successfully",
              successfully_removed.len(), successfully_removed.len());

    Ok(successfully_removed)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_all_scada_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
) -> Result<Vec<String>> {  // Retourne les IDs de tous les feeders supprimés
    log::info!("Starting unsubscription of all SCADA feeders");

    let mut tasks_state = tasks_state.lock().await;

    // Récupérer tous les IDs des tâches actuelles
    let all_feeder_ids: Vec<String> = tasks_state.get_tasks_status().keys().cloned().collect();
    let feeder_count = all_feeder_ids.len();

    log::info!("Found {} active feeders to remove", feeder_count);

    let mut successfully_removed = Vec::new();

    for feeder_id in all_feeder_ids {
        log::info!("Removing feeder: {}", feeder_id);

        match tasks_state.close_task(&feeder_id).await {
            Ok(()) => {
                log::info!("NATS feeder '{}' removed successfully", feeder_id);
                successfully_removed.push(feeder_id);
            }
            Err(e) => {
                log::error!("Failed to remove NATS feeder '{}': {:?}", feeder_id, e);
            }
        }
    }

    log::info!("Unsubscription of all feeders completed: {}/{} feeders removed successfully",
              successfully_removed.len(), feeder_count);

    Ok(successfully_removed)
}