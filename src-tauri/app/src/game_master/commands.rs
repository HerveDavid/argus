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
