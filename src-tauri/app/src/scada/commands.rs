use std::sync::atomic::AtomicBool;
use std::sync::Arc;

use crate::entities::sld_metadata::SldMetadata;
use crate::nats::state::NatsState;
use crate::powsybl::entities::SQLQueryRequest;
use crate::scada::entities::ScadaOutput;
use crate::sessions::state::SessionState;
use crate::tasks::state::TasksState;

use super::entities::ScadaMessage;
use super::error::{Error, Result};
use super::utils::{self, create_task_feeder_v2};

use tauri::ipc::Channel;
use tauri::State;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScadaOutputQuery {
    pub id: String,
    pub dynawo_id: String,
    pub tase2: String,
    pub source: String,
    pub destination: String,
    pub topic: String,
    #[serde(default)]
    pub graphical_id: Option<String>,
    #[serde(default)]
    pub publish_on_change: Option<bool>,
    #[serde(default)]
    pub graphical_id_1: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScadaOutputResponse {
    pub success: bool,
    pub data: Option<Vec<ScadaOutputQuery>>,
    pub error: Option<String>,
    pub row_count: Option<i32>,
    pub columns: Option<Vec<String>>,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_command_breaker_scada(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    graphical_id: String,
    value: f64,
) -> Result<()> {
    let sql_query = SQLQueryRequest {
        query: "WITH decoded AS (SELECT ?1 as graphical_id, REPLACE(REPLACE(REPLACE(SUBSTR(?1, 3), '_32_', ' '), '_95_', '_'), '_46_', '.') as decoded_id) SELECT so.*, decoded.graphical_id FROM scada_outputs so, decoded WHERE so.dynawo_id LIKE '%' || decoded.decoded_id || '%'".to_string(),
        parameters: Some(vec![serde_json::Value::String(graphical_id.clone())]),
        limit: Some(1), // On n'a besoin que d'un seul résultat
    };

    let session = session_state.lock().await;
    let query_response = session
        .post::<ScadaOutputResponse, SQLQueryRequest>("powsybl/query", &sql_query)
        .await
        .map_err(|e| {
            eprintln!(
                "Failed to query database for graphical_id {}: {}",
                graphical_id, e
            );
            Error::DatabaseError(format!("Database query failed: {}", e))
        })?;

    // Vérifier si la requête a réussi
    if !query_response.success {
        return Err(Error::DatabaseError(
            query_response
                .error
                .unwrap_or_else(|| "Unknown database error".to_string()),
        ));
    }

    // Extraire l'equipment_id depuis les résultats avec le type spécifique
    let game_master_output = query_response
        .data
        .as_ref()
        .and_then(|data| data.first())
        .ok_or_else(|| Error::EquipmentNotFound(graphical_id.clone()))?;

    let equipment_id = &game_master_output.tase2;
    log::debug!(
        "Found equipment_id: {} for graphical_id: {}",
        equipment_id,
        graphical_id
    );

    // Créer la commande JSON avec l'equipment_id comme clé
    let command = serde_json::json!({
        "tase2": equipment_id,
        "stVal": value != 0.0,  // pour TC
    });

    // Obtenir le client NATS
    let nats_guard = nats_state.lock().await;
    let client = nats_guard
        .try_client()
        .map_err(|_| Error::ClientNotInitialized)?;

    let command_str = serde_json::to_string(&command).map_err(|e| {
        log::error!("Failed to serialize command: {}", e);
        Error::SerializationError(e)
    })?;

    // Utiliser le topic depuis game_master_output si disponible, sinon une valeur par défaut
    let topic = format!("HMIControl");
    log::debug!("Publishing command to topic: {}", topic);

    // Publier la commande
    match client.publish(topic, command_str.clone().into()).await {
        Ok(_) => {
            log::info!("Command successfully published to broker: {}", &command_str);
            Ok(())
        }
        Err(err) => {
            log::error!("Failed to publish command to broker: {}", err);
            Err(Error::NatsPublishError(err.to_string()))
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_scada_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    metadata: SldMetadata,
    id: String,
    channel: Channel<ScadaMessage>,
) -> Result<Vec<ScadaOutput>> {
    let session_client = session_state.lock().await;

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

    let task = create_task_feeder_v2(nats_client, session_client, metadata, channel).await;
    tasks_state.lock().await.add_task(id, task)?;

    Ok(vec![])
}

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_single_scada_feeder(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    output: ScadaOutput,
    channel: Channel<ScadaMessage>,
) -> Result<bool> {
    // Get NATS client
    let nats_client = {
        let nats_state = nats_state.lock().await;
        match nats_state.get_client() {
            Some(client) => client,
            None => return Err(Error::ClientNotInitialized),
        }
    };

    let id = output.id.clone();
    let paused = Arc::new(AtomicBool::new(false));
    let task = utils::create_task_feeder(nats_client.clone(), channel, output, paused);

    tasks_state.lock().await.add_task(id.clone(), task)?;

    log::info!("Subscribed to individual feeder: {}", id);
    Ok(true)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_scada_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    id: String,
) -> Result<bool> {
    let mut tasks_guard = tasks_state.lock().await;
    tasks_guard.close_task(&id).await?;

    Ok(true)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_all_scada_feeders(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
) -> Result<Vec<String>> {
    // Retourne les IDs de tous les feeders supprimés
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

    log::info!(
        "Unsubscription of all feeders completed: {}/{} feeders removed successfully",
        successfully_removed.len(),
        feeder_count
    );

    Ok(successfully_removed)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_scada_outputs(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    metadata: SldMetadata,
) -> Result<Vec<ScadaOutput>> {
    let session_client = session_state.lock().await;
    utils::get_scada_outputs(session_client, metadata).await
}
