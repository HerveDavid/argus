use super::entities::{
    NatsAddressResponse, NatsConnectionResponse, NatsConnectionStatus, NatsDisconnectionResponse,
};
use super::error::Result;
use super::state::NatsState;

use std::sync::Arc;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn set_nats_address(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    address: String,
) -> Result<NatsAddressResponse> {
    if address.trim().is_empty() {
        return Err(super::error::Error::InvalidAddress(
            "Address cannot be empty".to_string(),
        ));
    }
    if !address.starts_with("nats://") && !address.starts_with("tls://") {
        return Err(super::error::Error::InvalidAddress(
            "Address must start with 'nats://' or 'tls://'".to_string(),
        ));
    }
    let mut state = nats_state.lock().await;
    if state.client.is_some() {
        return Err(super::error::Error::AlreadyConnected(
            "Cannot change address while connected. Disconnect first.".to_string(),
        ));
    }
    state.address = address.clone();
    Ok(NatsAddressResponse {
        address: address.clone(),
        message: format!("Address set to {}", address),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn connect_nats(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<NatsConnectionResponse> {
    let mut state = nats_state.lock().await;
    if state.client.is_some() {
        return Err(super::error::Error::AlreadyConnected(
            "Already connected to NATS server".to_string(),
        ));
    }
    match async_nats::connect(&state.address).await {
        Ok(client) => {
            let client_arc = Arc::new(client);
            state.client = Some(client_arc);
            Ok(NatsConnectionResponse {
                success: true,
                address: state.address.clone(),
                message: format!("Successfully connected to {}", state.address),
            })
        }
        Err(e) => {
            state.client = None;
            Err(super::error::Error::ConnectError(e))
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn disconnect_nats(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<NatsDisconnectionResponse> {
    let mut state = nats_state.lock().await;
    if state.client.is_none() {
        return Err(super::error::Error::NotConnected(
            "Not connected to any NATS server".to_string(),
        ));
    }
    let channel_count = state.channels.len();
    for (channel_name, (handle, shutdown_tx)) in state.channels.drain() {
        let _ = shutdown_tx.send(());
        let timeout_duration = tokio::time::Duration::from_secs(5);
        match tokio::time::timeout(timeout_duration, handle).await {
            Ok(_) => {
                log::info!("Channel '{}' stopped successfully", channel_name);
            }
            Err(_) => {
                log::warn!("Channel '{}' did not stop within timeout", channel_name);
            }
        }
    }
    if let Some(client) = state.client.take() {
        drop(client);
    }
    Ok(NatsDisconnectionResponse {
        success: true,
        message: format!(
            "Successfully disconnected from NATS server. Stopped {} active channels.",
            channel_count
        ),
        channels_stopped: channel_count,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_nats_connection_status(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<NatsConnectionStatus> {
    let state = nats_state.lock().await;
    let status = NatsConnectionStatus {
        connected: state.client.is_some(),
        address: state.address.clone(),
        active_channels: state.channels.len(),
        channel_names: state.channels.keys().cloned().collect(),
    };
    Ok(status)
}


