use crate::state::SettingsState;

use super::errors::{SettingResult, SettingsError};
use serde::Serialize;
use tauri::State;
use zeromq::Socket;

#[derive(Debug, Serialize)]
pub struct ZmqUrlResponse {
    pub status: String,
    pub url: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_zmq_url(
    state: State<'_, SettingsState>,
    zmq_url: String,
) -> SettingResult<ZmqUrlResponse> {
    if !zmq_url.is_empty() {
        let mut zmq_client = zeromq::SubSocket::new();
        match zmq_client.connect(&zmq_url).await {
            Ok(_) => {
                // Modifier le client ZMQ
                if let Ok(mut client) = state.zmq_client.write() {
                    *client = zmq_client;
                } else {
                    return Err(SettingsError::StateLock(
                        "Failed to lock ZMQ client".to_string(),
                    ));
                }

                // Modifier l'URL ZMQ
                if let Ok(mut url) = state.zmq_url.write() {
                    *url = Some(zmq_url.clone());
                } else {
                    return Err(SettingsError::StateLock(
                        "Failed to lock ZMQ URL".to_string(),
                    ));
                }
            }
            Err(_) => {
                return Err(SettingsError::StateLock(
                    "Failed to connect to ZMQ server".to_string(),
                ));
            }
        }
    } else {
        // Réinitialiser l'URL ZMQ
        if let Ok(mut url) = state.zmq_url.write() {
            *url = None;
        } else {
            return Err(SettingsError::StateLock(
                "Failed to lock ZMQ URL".to_string(),
            ));
        }

        // Réinitialiser le client ZMQ
        if let Ok(mut client) = state.zmq_client.write() {
            *client = zeromq::SubSocket::new();
        } else {
            return Err(SettingsError::StateLock(
                "Failed to lock ZMQ client".to_string(),
            ));
        }
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
pub async fn get_zmq_url(state: State<'_, SettingsState>) -> SettingResult<ZmqUrlResponse> {
    // Récupérer l'URL ZMQ
    let zmq_url = if let Ok(url) = state.zmq_url.read() {
        url.clone()
    } else {
        return Err(SettingsError::StateLock(
            "Failed to lock ZMQ URL".to_string(),
        ));
    };

    Ok(ZmqUrlResponse {
        status: match &zmq_url {
            Some(_) => "configured".to_string(),
            None => "not_configured".to_string(),
        },
        url: zmq_url.unwrap_or_default(),
    })
}
