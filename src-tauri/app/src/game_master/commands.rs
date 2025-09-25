use crate::entities::sld_metadata::SldMetadata;
use crate::nats::state::NatsState;
use crate::powsybl::entities::SQLQueryRequest;
use crate::sessions::state::SessionState;

use super::entities::ScadaOutput;
use super::error::{Error, Result};
use super::state::*;
use super::utils;

use log::{debug, warn};
use tauri::State;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMasterOutput {
    pub id: String,
    pub dynawo_id: String,
    pub model: String,
    pub variable: String,
    #[serde(default)]
    pub model_lib: Option<String>,
    pub equipment_id: String,
    pub kind: String,
    pub voltage_level: String,
    pub substation: String,
    pub graphical_id: String,
    pub iidm_class: String,
    pub topic: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameMasterOutputResponse {
    pub success: bool,
    pub data: Option<Vec<GameMasterOutput>>,
    pub error: Option<String>,
    pub row_count: Option<i32>,
    pub columns: Option<Vec<String>>,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_command_breaker_gm(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    graphical_id: String,
    value: f64,
) -> Result<()> {
    let sql_query = SQLQueryRequest {
        query: "SELECT * FROM game_master_outputs WHERE graphical_id = ?".to_string(),
        parameters: Some(vec![serde_json::Value::String(graphical_id.clone())]),
        limit: Some(1), // On n'a besoin que d'un seul résultat
    };

    let session = session_state.lock().await;
    let query_response = session
        .post::<GameMasterOutputResponse, SQLQueryRequest>("powsybl/query", &sql_query)
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

    let equipment_id = &game_master_output.equipment_id;
    log::debug!(
        "Found equipment_id: {} for graphical_id: {}",
        equipment_id,
        graphical_id
    );

    // Créer la commande JSON avec l'equipment_id comme clé
    let command = serde_json::json!({
        equipment_id: value
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
    let topic = format!("{}Control", game_master_output.topic);
    log::debug!("Publishing command to topic: {}", topic);

    // Publier la commande
    match client.publish(topic, command_str.into()).await {
        Ok(_) => {
            log::info!("Command successfully published to broker");
            Ok(())
        }
        Err(err) => {
            log::error!("Failed to publish command to broker: {}", err);
            Err(Error::NatsPublishError(err.to_string()))
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_gamemaster_url(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    url: String,
) -> Result<GameMasterUrlResponse> {
    println!("=== set_gamemaster_url appelée avec: {}", url);

    println!("=== Tentative d'acquisition du verrou...");
    let mut state = gamemaster_state.lock().await;
    println!("=== Verrou acquis!");

    let result = state.set_url(url);
    println!("=== Résultat: {:?}", result);

    result
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_gamemaster_url(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
) -> Result<GameMasterStatus> {
    let state = gamemaster_state.lock().await;
    Ok(state.get_url())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_game_master_outputs(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    metadata: SldMetadata,
) -> Result<Vec<ScadaOutput>> {
    let session_client = session_state.lock().await;
    utils::get_scada_outputs(session_client, metadata).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn init_game_master_scenario(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    dsl_file_content: Vec<u8>,
    simulation_name: Option<String>,
    artifact_id: Option<String>,
) -> Result<SimulationConfig> {
    let state = gamemaster_state.lock().await;
    state
        .init_scenario(dsl_file_content, simulation_name, artifact_id)
        .await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn trainer_get_current_state_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    start_time: Option<f64>,
    end_time: Option<f64>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.trainer_get_current_state(start_time, end_time).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_dsl_file_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    simulation_name: String,
) -> Result<String> {
    let state = gamemaster_state.lock().await;
    state.get_dsl_file(&simulation_name).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn simulator_control_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    current_time: f64,
) -> Result<AggregateOutput> {
    let state = gamemaster_state.lock().await;
    let input = AggregateInput { current_time };
    state.simulator_control(&input).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn sim_update_system_state_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    current_time: f64,
    state: Option<serde_json::Value>,
) -> Result<serde_json::Value> {
    let gm_state = gamemaster_state.lock().await;
    let update = SystemStateUpdate {
        current_time,
        state,
    };
    gm_state.sim_update_system_state(&update).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn simulator_control_v2_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    current_time: f64,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    let input = AggregateInput { current_time };
    state.simulator_control_v2(&input).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn user_control_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    control_type: String,
    action: String,
    id: String,
    timestamp: f64,
    value: Option<f64>,
    interval_start: Option<f64>,
    interval_end: Option<f64>,
    law: Option<String>,
    metadata: Option<serde_json::Value>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    let control = ControlInput {
        control_type,
        action,
        id,
        value,
        timestamp,
        interval_start,
        interval_end,
        law,
        metadata,
    };
    state.user_control(&control).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn dsl_control_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    control: String,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.dsl_control(&control).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn cluster_control_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    control_type: String,
    action: String,
    target: ClusterTarget,
    timestamp: f64,
    value: Option<f64>,
    interval_start: Option<f64>,
    interval_end: Option<f64>,
    law: Option<String>,
    metadata: Option<serde_json::Value>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    let control = ClusterControlInput {
        control_type,
        action,
        target,
        timestamp,
        value,
        interval_start,
        interval_end,
        law,
        metadata,
    };
    state.cluster_control(&control).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn user_get_current_state_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.user_get_current_state().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_pending_controls_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.get_pending_controls().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn upload_iidm_file_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    file_content: Vec<u8>,
    file_name: String,
    artifact_id: Option<String>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state
        .upload_iidm_file(file_content, &file_name, artifact_id)
        .await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_iidm_properties_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    file_id: String,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.get_iidm_properties(&file_id).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_events_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    status: Option<String>,
    source: Option<String>,
    time_spec: Option<String>,
    simulation: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state
        .list_events(
            status.as_deref(),
            source.as_deref(),
            time_spec.as_deref(),
            simulation.as_deref(),
            limit,
            offset,
        )
        .await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_queue_summary_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.get_queue_summary().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_saved_simulations_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.list_saved_simulations().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_saved_iidm_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.list_saved_iidm().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_dsl_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    simulation_name: String,
    dsl_file_content: Vec<u8>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.update_dsl(simulation_name, dsl_file_content).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_dsl_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    simulation_name: String,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.delete_dsl(simulation_name).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn trainer_update_system_state_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    current_time: f64,
    state: Option<serde_json::Value>,
) -> Result<serde_json::Value> {
    let gm_state = gamemaster_state.lock().await;
    let update = SystemStateUpdate {
        current_time,
        state,
    };
    gm_state.trainer_update_system_state(&update).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn user_status_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.user_status().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn enqueue_next_step_dsl_command(
    gamemaster_state: State<'_, tokio::sync::Mutex<GameMasterState>>,
    dsl: String,
) -> Result<serde_json::Value> {
    let state = gamemaster_state.lock().await;
    state.enqueue_next_step_dsl(dsl).await
}
