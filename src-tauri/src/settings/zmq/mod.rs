use super::errors::{SettingResult, SettingsError};
use crate::state::AppState;
use serde::Serialize;
use std::sync::Arc;
use tauri::State;
use zeromq::Socket;

#[derive(Debug, Serialize)]
pub struct ZmqUrlResponse {
    pub status: String,
    pub url: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_zmq_url(
    state: State<'_, AppState>,
    zmq_url: String,
) -> SettingResult<ZmqUrlResponse> {
    if !zmq_url.is_empty() {
        let mut zmq_client = zeromq::SubSocket::new();

        match zmq_client.connect(&zmq_url).await {
            Ok(_) => {
                let mut app_state = state
                    .write()
                    .map_err(|e| SettingsError::StateLock(e.to_string()))?;

                app_state.settings.zmq_client = Arc::new(zmq_client);
                app_state.settings.zmq_url = Some(zmq_url.clone());

                drop(app_state); // Explicitly release the lock
            }
            Err(_) => {
                return Err(SettingsError::StateLock(
                    "Failed to connect to ZMQ server".to_string(),
                ))
            }
        }
    } else {
        let mut app_state = state
            .write()
            .map_err(|e| SettingsError::StateLock(e.to_string()))?;

        app_state.settings.zmq_url = None;
        let zmq_client = zeromq::SubSocket::new();
        app_state.settings.zmq_client = Arc::new(zmq_client);

        drop(app_state); // Explicitly release the lock
    }

    Ok(ZmqUrlResponse {
        status: if zmq_url.is_empty() {
            "cleared".to_string()
        } else {
            "configured".to_string()
        },
        url: zmq_url,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_zmq_url(state: State<'_, AppState>) -> SettingResult<ZmqUrlResponse> {
    // Acquire the lock
    let zmq_url = {
        let app_state = state
            .read()
            .map_err(|e| SettingsError::StateLock(e.to_string()))?;
        app_state.settings.zmq_url.clone()

    };

    Ok(ZmqUrlResponse {
        status: match &zmq_url {
            Some(_) => "configured".to_string(),
            None => "not_configured".to_string(),
        },
        url: zmq_url.unwrap_or_default(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_zmq_subscription(
    state: State<'_, AppState>,
    subscription: String,
) -> SettingResult<()> {
    let mut new_client = zeromq::SubSocket::new();

    let zmq_url = {
        let app_state = state
            .read()
            .map_err(|e| SettingsError::StateLock(e.to_string()))?;

        app_state.settings.zmq_url.clone()
    };

    if let Some(url) = zmq_url {
        new_client
            .connect(&url)
            .await
            .map_err(|_| SettingsError::StateLock("Failed to connect to ZMQ server".to_string()))?;

        new_client
            .subscribe(&subscription)
            .await
            .map_err(|_| SettingsError::StateLock("Failed to set subscription".to_string()))?;

        let mut app_state = state
            .write()
            .map_err(|e| SettingsError::StateLock(e.to_string()))?;

        app_state.settings.zmq_client = Arc::new(new_client);
    } else {
        return Err(SettingsError::StateLock(
            "ZMQ URL not configured".to_string(),
        ));
    }

    Ok(())
}
