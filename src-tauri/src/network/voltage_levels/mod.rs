use super::errors::NetworkError;

use crate::network::entities::{VoltageLevel, VoltageLevels};
use crate::network::errors::NetworkResult;
use crate::state::AppState;

use tauri::State;

/// Get all voltage levels from the API
#[tauri::command(rename_all = "snake_case")]
pub async fn get_voltage_levels(state: State<'_, AppState>) -> NetworkResult<Vec<VoltageLevel>> {
    // Clone the client to avoid holding MutexGuard across await
    let client = {
        let app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.client.clone()
    };

    // Use the cloned client for the request
    let response = client
        .get("http://localhost:8000/api/v1/network/voltage_levels")
        .send()
        .await?;

    // Check for successful status code
    if !response.status().is_success() {
        return Err(NetworkError::ApiError(response.status().to_string()));
    }

    // Get the response text
    let text = response.text().await?;

    // Try to parse as a container with voltage_levels field first
    let voltage_levels = match serde_json::from_str::<VoltageLevels>(&text) {
        Ok(response) => {
            // Successfully parsed as a container
            response.voltage_levels
        }
        Err(_) => {
            // Try parsing as direct array of voltage levels
            serde_json::from_str::<Vec<VoltageLevel>>(&text)?
        }
    };

    // Update the app state with the new voltage levels
    {
        let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.voltage_levels = voltage_levels.clone();
    }

    Ok(voltage_levels)
}
