use super::entities::{
    NatsAddressResponse, NatsConnectionResponse, NatsConnectionStatus, NatsDisconnectionResponse,
};
use super::error::Result;
use super::state::NatsState;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn set_nats_address(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    address: String,
) -> Result<NatsAddressResponse> {
    let mut state = nats_state.lock().await;
    state.set_address(address)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn connect_nats(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<NatsConnectionResponse> {
    let mut state = nats_state.lock().await;
    state.connect().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn disconnect_nats(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<NatsDisconnectionResponse> {
    let mut state = nats_state.lock().await;
    state.disconnect().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_nats_connection_status(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<NatsConnectionStatus> {
    let state = nats_state.lock().await;
    Ok(state.get_status())
}
