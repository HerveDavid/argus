use super::errors::NetworkError;

use crate::network::entities::*;
use crate::network::errors::NetworkResult;
use crate::state::AppState;

use tauri::State;

/// Get all substations from the API
#[tauri::command(rename_all = "snake_case")]
pub async fn get_substations(state: State<'_, AppState>) -> NetworkResult<Vec<Substation>> {
    // Clone the client to avoid holding MutexGuard across await
    let client = {
        let app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.settings.client.clone()
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

    // Convert to HashMap and update the app state
    {
        let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        // Clear existing substations and add new ones
        app_state.network.substations.clear();
        for substation in &substations {
            app_state
                .network
                .substations
                .insert(substation.id.clone(), substation.clone());
        }
    }

    // Return Vec<Substation> for backward compatibility
    Ok(substations)
}

/// Load all substations from the API and store them in the application state
#[tauri::command(rename_all = "snake_case")]
pub async fn load_substations(state: State<'_, AppState>) -> NetworkResult<FetchStatus> {
    // Clone the client to avoid holding MutexGuard across await
    let client = {
        let app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.settings.client.clone()
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

    // Convert to HashMap and update the app state
    {
        let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        // Clear existing substations and add new ones
        app_state.network.substations.clear();
        for substation in substations {
            app_state
                .network
                .substations
                .insert(substation.id.clone(), substation);
        }
    }

    Ok(FetchStatus {
        success: true,
        message: "Substations loaded successfully".to_string(),
    })
}

/// Get paginated substations from application state (no API call)
#[tauri::command(rename_all = "snake_case")]
pub fn get_paginated_substations(
    state: State<'_, AppState>,
    pagination: Option<PaginationParams>,
) -> NetworkResult<PaginatedResponse<Vec<Substation>>> {
    // Use pagination parameters or default values
    let params = pagination.unwrap_or_default();

    // Access state with a lock
    let app_state = state.lock().map_err(|_| NetworkError::LockError)?;

    // Get total count directly from HashMap size
    let total = app_state.network.substations.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    // Collect only the needed items for the current page
    let page_items: Vec<Substation> = app_state
        .network
        .substations
        .values()
        .skip((params.page - 1) * params.per_page)
        .take(params.per_page)
        .cloned()
        .collect();

    // Return the paginated response
    Ok(PaginatedResponse {
        items: page_items,
        total,
        page: params.page,
        per_page: params.per_page,
        total_pages,
    })
}

/// Get a specific substation by ID
#[tauri::command(rename_all = "snake_case")]
pub fn get_substation_by_id(
    state: State<'_, AppState>,
    id: String,
) -> NetworkResult<Option<Substation>> {
    let app_state = state.lock().map_err(|_| NetworkError::LockError)?;

    // Directly get the substation from the HashMap by ID and clone it
    let substation = app_state.network.substations.get(&id).cloned();

    Ok(substation)
}
