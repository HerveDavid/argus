use std::sync::Arc;

use ecs::mode::resources::Kind;
use ecs::powsybl::components::DiagramEvent;
use ecs::tauri::events::TauriEvent;
use tauri::{ipc::Channel, State};

use crate::mode::state::ModeState;

use super::error::{Error, Result};
use super::state::EcsState;

#[tauri::command(rename_all = "snake_case")]
pub async fn switch_mode_ecs(
    ecs_state: State<'_, Arc<tokio::sync::Mutex<EcsState>>>,
    mode: ModeState,
) -> Result<()> {
    let kind = match mode {
        ModeState::Scada => Ok(Kind::Scada),
        ModeState::GameMaster => Ok(Kind::GameMaster),
        ModeState::Kpi => Err(Error::ModeNotImplemented),
    }?;
    ecs_state.lock().await.send(TauriEvent::SwitchMode { kind })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn add_subscription(
    ecs_state: State<'_, Arc<tokio::sync::Mutex<EcsState>>>,
    element_id: String,
    channel: Channel<DiagramEvent>,
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
