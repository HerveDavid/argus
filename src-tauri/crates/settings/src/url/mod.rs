use super::errors::{SettingResult, SettingsError};
use crate::state::AppState;
use serde::Serialize;
use tauri::State;

#[derive(Debug, Serialize)]
pub struct ServerUrlResponse {
    pub status: String,
    pub url: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_server_url(
    state: State<'_, AppState>,
    server_url: String,
) -> SettingResult<ServerUrlResponse> {
    // Lock the state with error handling
    let mut app_state = state
        .write()
        .map_err(|e| SettingsError::StateLock(e.to_string()))?;

    // Update the server URL (allowing empty string to clear the setting)
    app_state.settings.server_url = if server_url.is_empty() {
        None
    } else {
        Some(server_url.clone())
    };

    // Return a meaningful response
    Ok(ServerUrlResponse {
        status: if server_url.is_empty() {
            "cleared".to_string()
        } else {
            "configured".to_string()
        },
        url: server_url,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_server_url(state: State<'_, AppState>) -> SettingResult<ServerUrlResponse> {
    // Lock the state with error handling
    let app_state = state
        .write()
        .map_err(|e| SettingsError::StateLock(e.to_string()))?;

    // Retrieve the server URL
    let server_url = app_state.settings.server_url.clone();

    // Return response with appropriate status message
    Ok(ServerUrlResponse {
        status: match &server_url {
            Some(_) => "configured".to_string(),
            None => "not_configured".to_string(),
        },
        url: server_url.unwrap_or_default(),
    })
}
