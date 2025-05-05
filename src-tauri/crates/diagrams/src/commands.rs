use log::{debug, info};
use tauri::{AppHandle, Manager, Runtime};

use crate::entities::{EventsData, Feeders, SldMetadata, SldResponse};
use crate::entry::{Entry, ReferenceMapper};
use crate::errors::{Result, SldError};
use crate::state::SldState;
use crate::utils::create_subscription;

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_diagram<R: Runtime>(
    app_handle: AppHandle<R>,
    metadata: SldMetadata,
) -> Result<SldResponse> {
    debug!(
        "subscribe_single_line_diagram called with SLD metadata: {:?}",
        metadata
    );

    let state = app_handle.state::<SldState>();
    let active_feeders = metadata.get_active_arrow_feeders();

    info!("Active feeders found: {}", active_feeders.len());

    for feeder in active_feeders {
        let id = feeder.id.clone();
        if state.read().map_err(|_| SldError::LockError)?.has_task(&id) {
            debug!("Task already exists for feeder {}, skipping", id);
            continue;
        }

        create_subscription(&state, id).await?;
    }

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
    id: String,
) -> Result<SldResponse> {
    let state = app_handle.state::<SldState>();
    let guard = state.read().map_err(|_| SldError::LockError)?;

    let mapping = guard.mapping.as_ref();
    let events = guard.events.as_ref();

    if mapping.is_none() {
        return Ok(SldResponse {
            status: "mapping is not defined".to_string(),
        });
    }

    if events.is_none() {
        return Ok(SldResponse {
            status: "events is not defined".to_string(),
        });
    }

    if let Some(mapping) = mapping {
        if let Some(Entry { equipment_id, .. }) = mapping.get_by_equipment(id.as_str()) {
            if let Some(EventsData { data }) = events {
                for event in data {
                    if event.equipement_id.eq(equipment_id) && event.value.eq("1") {
                        println!("{:?}", event);
                        break;
                    }
                }
            }
        }
    }

    Ok(SldResponse {
        status: "".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn event_close_breaker<R: Runtime>(
    app_handle: AppHandle<R>,
    id: String,
) -> Result<SldResponse> {
    let state = app_handle.state::<SldState>();
    let guard = state.read().map_err(|_| SldError::LockError)?;

    let mapping = guard.mapping.as_ref();
    let events = guard.events.as_ref();

    if mapping.is_none() {
        return Ok(SldResponse {
            status: "mapping is not defined".to_string(),
        });
    }

    if events.is_none() {
        return Ok(SldResponse {
            status: "events is not defined".to_string(),
        });
    }

    if let Some(mapping) = mapping {
        if let Some(Entry { equipment_id, .. }) = mapping.get_by_equipment(id.as_str()) {
            if let Some(EventsData { data }) = events {
                for event in data {
                    if event.equipement_id.eq(equipment_id) && event.value.eq("0") {
                        println!("{:?}", event);
                        break;
                    }
                }
            }
        }
    }

    Ok(SldResponse {
        status: "".to_string(),
    })
}
