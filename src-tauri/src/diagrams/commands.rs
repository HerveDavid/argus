use log::{debug, info};
use tauri::State;
use tauri::{ipc::Channel, AppHandle, Manager, Runtime};

use crate::state::AppState;

use super::entities::{CurveData, EventsData, Feeders, SldMetadata, SldResponse};
use super::entry::{Entry, ReferenceMapper};
use super::errors::{Result, SldError};
use super::state::SldState;
use super::utils::create_subscription;

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_diagram(
    state: &State<'_, AppState>,
    metadata: SldMetadata,
    channel: Channel<CurveData>,
) -> Result<SldResponse> {
    debug!("subscribe_diagram called with SLD metadata: {:?}", metadata);

    let mut state_guard = state.write().map_err(|_| SldError::LockError)?;
    let active_feeders = metadata.get_active_arrow_feeders();

    state_guard.sld_state.channel = Some(channel);

    info!("Active feeders found: {}", active_feeders.len());

    for feeder in active_feeders {
        let id = feeder.id.clone();
        if state_guard.sld_state.has_task(&id) {
            debug!("Task already exists for feeder {}, skipping", id);
            continue;
        }

        create_subscription(&state_guard.sld_state, id).await?;
    }

    state_guard.sld_state.start_process();

    Ok(SldResponse {
        status: "connected".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_diagram<R: Runtime>(
    app_handle: AppHandle<R>,
    metadata: SldMetadata,
) -> Result<SldResponse> {
    debug!("unsubscribe_diagram called");

    let state = app_handle.state::<SldState>();
    let active_feeders = metadata.get_active_arrow_feeders();
    info!("Stopping tasks for {} active feeders", active_feeders.len());

    for feeder in active_feeders {
        let feeder_id = feeder.id.clone();
        let task_id = feeder_id.clone();
        debug!("Attempting to stop task for feeder: {}", feeder_id);

        if let Ok(mut state_guard) = state.write() {
            if state_guard.stop_task(&task_id) {
                info!("Task successfully stopped for feeder {}", feeder_id);
            } else {
                debug!("No task found for feeder {}", feeder_id);
            }
        }
    }

    Ok(SldResponse {
        status: "disconnected".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_feeders<R: Runtime>(
    app_handle: AppHandle<R>,
    feeders: Feeders,
) -> Result<SldResponse> {
    let state = app_handle.state::<SldState>();
    let mapping = ReferenceMapper::from(feeders);

    state.try_write().map_err(|_| SldError::LockError)?.mapping = Some(mapping);

    Ok(SldResponse {
        status: "updated".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_events<R: Runtime>(
    app_handle: AppHandle<R>,
    events: EventsData,
) -> Result<SldResponse> {
    let state = app_handle.state::<SldState>();
    state.try_write().map_err(|_| SldError::LockError)?.events = Some(events);

    Ok(SldResponse {
        status: "updated".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn event_open_breaker<R: Runtime>(
    app_handle: AppHandle<R>,
    svg_id: String,
) -> Result<SldResponse> {
    let state = app_handle.state::<SldState>();
    let guard = state.read().map_err(|_| SldError::LockError)?;

    let mapping = guard.mapping.as_ref();
    let events = guard.events.as_ref();

    let status = match (mapping, events) {
        (Some(mapping), Some(EventsData { data })) => mapping
            .get_by_svg(&svg_id)
            .and_then(|Entry { equipment_id, .. }| {
                data.iter()
                    .find(|e| e.equipement_id == *equipment_id && e.value == "1")
                    .inspect(|e| println!("TODO Implemented zmq {e:?}"))
                    .map(|_| String::new())
            })
            .unwrap_or_else(|| format!("no matching event found for {}", svg_id)),
        (None, _) => "mapping is not defined".to_string(),
        (_, None) => "events is not defined".to_string(),
    };

    Ok(SldResponse { status })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn event_close_breaker<R: Runtime>(
    app_handle: AppHandle<R>,
    svg_id: String,
) -> Result<SldResponse> {
    let state = app_handle.state::<SldState>();
    let guard = state.read().map_err(|_| SldError::LockError)?;

    let mapping = guard.mapping.as_ref();
    let events = guard.events.as_ref();

    let status = match (mapping, events) {
        (Some(mapping), Some(EventsData { data })) => mapping
            .get_by_svg(&svg_id)
            .and_then(|Entry { equipment_id, .. }| {
                data.iter()
                    .find(|e| e.equipement_id == *equipment_id && e.value == "0")
                    .inspect(|e| println!("TODO Implemented zmq {e:?}"))
                    .map(|_| String::new())
            })
            .unwrap_or_else(|| format!("no matching event found for {}", svg_id)),
        (None, _) => "mapping is not defined".to_string(),
        (_, None) => "events is not defined".to_string(),
    };

    Ok(SldResponse { status })
}
