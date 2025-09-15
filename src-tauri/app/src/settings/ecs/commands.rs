use std::sync::Arc;

use ecs::tauri::events::TauriEvent;
use tauri::{ipc::Channel, State};

use super::error::Result;
use super::state::EcsState;

#[tauri::command(rename_all = "snake_case")]
pub async fn add_subscription(
    ecs_state: State<'_, Arc<tokio::sync::Mutex<EcsState>>>,
    element_id: String,
    channel: Channel<String>,
) -> Result<()> {
    ecs_state.lock().await.send(TauriEvent::Subscribe {
        element_id,
        channel,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_subscription(
    ecs_state: State<'_, Arc<tokio::sync::Mutex<EcsState>>>,
    element_id: String,
) -> Result<()> {
    ecs_state
        .lock()
        .await
        .send(TauriEvent::Unubscribe { element_id })
}
