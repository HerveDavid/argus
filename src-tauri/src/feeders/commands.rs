use super::entities::{FeederActionResponse, FeederStatus, FeedersListResponse};
use super::error::{Error, Result};
use super::state::FeedersState;

use crate::entities::sld_metadata::SldMetadata;
use crate::feeders::entities::FeedersStatistics;
use crate::nats::state::NatsState;

use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn start_feeder(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    id: String,
    metadata: SldMetadata,
) -> Result<FeederActionResponse> {
    // Get NATS client
    let nats_client = {
        let nats_state = nats_state.lock().await;
        nats_state.get_client().ok_or(Error::ClientNotInitialized)?
    };

    // Start feeder
    let mut feeders_state = feeders_state.lock().await;

    match feeders_state
        .start_feeder(id.clone(), metadata, nats_client)
        .await
    {
        Ok(()) => {
            let feeder_status = FeederStatus::new(id.clone(), true, Some(false));
            Ok(FeederActionResponse {
                success: true,
                message: format!("Feeder '{}' started successfully", id),
                feeder_status: Some(feeder_status),
            })
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn close_feeder(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
    id: String,
) -> Result<FeederActionResponse> {
    let mut feeders_state = feeders_state.lock().await;

    match feeders_state.close_feeder(&id).await {
        Ok(()) => Ok(FeederActionResponse {
            success: true,
            message: format!("Feeder '{}' closed successfully", id),
            feeder_status: Some(FeederStatus::not_found(id)),
        }),
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn pause_feeder(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
    id: String,
) -> Result<FeederActionResponse> {
    let mut feeders_state = feeders_state.lock().await;

    match feeders_state.pause_feeder(&id).await {
        Ok(()) => {
            let feeder_status = FeederStatus::new(id.clone(), true, Some(true));
            Ok(FeederActionResponse {
                success: true,
                message: format!("Feeder '{}' paused successfully", id),
                feeder_status: Some(feeder_status),
            })
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn resume_feeder(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
    id: String,
) -> Result<FeederActionResponse> {
    let mut feeders_state = feeders_state.lock().await;

    match feeders_state.resume_feeder(&id).await {
        Ok(()) => {
            let feeder_status = FeederStatus::new(id.clone(), true, Some(false));
            Ok(FeederActionResponse {
                success: true,
                message: format!("Feeder '{}' resumed successfully", id),
                feeder_status: Some(feeder_status),
            })
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_feeder_status(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
    id: String,
) -> Result<FeederStatus> {
    let feeders_state = feeders_state.lock().await;

    match feeders_state.is_feeder_paused(&id) {
        Some(is_paused) => Ok(FeederStatus::new(id, true, Some(is_paused))),
        None => Ok(FeederStatus::not_found(id)),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_active_feeders(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
) -> Result<FeedersListResponse> {
    let feeders_state = feeders_state.lock().await;

    let feeders_status = feeders_state.get_feeders_status();
    let active_feeders: Vec<FeederStatus> = feeders_status
        .into_iter()
        .map(|(id, is_paused)| FeederStatus::new(id, true, Some(is_paused)))
        .collect();

    let total_count = active_feeders.len();

    Ok(FeedersListResponse {
        active_feeders,
        total_count,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_feeder_count(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
) -> Result<usize> {
    let feeders_state = feeders_state.lock().await;
    Ok(feeders_state.feeder_count())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_feeders_statistics(
    feeders_state: State<'_, tokio::sync::Mutex<FeedersState>>,
) -> Result<FeedersStatistics> {
    let feeders_state = feeders_state.lock().await;

    let feeders_status = feeders_state.get_feeders_status();
    let total_feeders = feeders_status.len();
    let paused_feeders = feeders_status
        .values()
        .filter(|&&is_paused| is_paused)
        .count();
    let running_feeders = total_feeders - paused_feeders;

    Ok(FeedersStatistics {
        total_feeders,
        active_feeders: total_feeders,
        paused_feeders,
        running_feeders,
    })
}
