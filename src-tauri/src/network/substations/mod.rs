use super::errors::NetworkError;

use crate::network::entities::{Substation, Substations};
use crate::network::errors::NetworkResult;
use crate::state::AppState;

use tauri::State;

/// Get all substations from the API
#[tauri::command(rename_all = "snake_case")]
pub async fn get_substations(state: State<'_, AppState>) -> NetworkResult<Vec<Substation>> {
    // Clone the client to avoid holding MutexGuard across await
    let client = {
        let app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.client.clone()
    };

    // Use the cloned client for the request
    let response = client
        .get("http://localhost:8000/api/v1/network/substations")
        .send()
        .await?;

    // Check for successful status code
    if !response.status().is_success() {
        return Err(NetworkError::ApiError(response.status().to_string()));
    }

    // Get the response text
    let text = response.text().await?;

    // Try to parse as a container with substations field first
    let substations = match serde_json::from_str::<Substations>(&text) {
        Ok(response) => {
            // Successfully parsed as a container
            response.substations
        }
        Err(_) => {
            // Try parsing as direct array of substations
            serde_json::from_str::<Vec<Substation>>(&text)?
        }
    };

    // Update the app state with the new substations
    {
        let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.substations = substations.clone();
    }

    Ok(substations)
}
