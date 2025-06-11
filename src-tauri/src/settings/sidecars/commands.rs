use log::info;
use tauri::State;
use tokio::sync::Mutex;

use crate::settings::sidecars::state::SidecarsState;

use super::error::{Result};

#[tauri::command]
pub async fn start_sidecar(state: State<'_, Mutex<SidecarsState>>, sidecar: String) -> Result<()> {
    info!("[tauri] Received command to start sidecar {}.", sidecar);

    state.lock().await.spawn_sidecar(&sidecar.as_str())?;

    info!(
        "[tauri] Sidecar {} spawned and monitoring started.",
        sidecar
    );

    Ok(())
}

#[tauri::command]
pub async fn shutdown_sidecar(
    state: State<'_, Mutex<SidecarsState>>,
    sidecar: String,
) -> Result<()> {
    info!("[tauri] Received command to shutdown sidecar {}.", sidecar);
    state.lock().await.despawn_sidecar(sidecar.as_str())?;
    info!("[tauri] Sidecar {} closed.", sidecar);

    Ok(())
}
