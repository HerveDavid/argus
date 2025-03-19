mod entities;

use entities::*;

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

/// Load all substations from the API and store them in the application state
#[tauri::command(rename_all = "snake_case")]
pub async fn load_substations(state: State<'_, AppState>) -> NetworkResult<FetchStatus> {
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
        app_state.substations = substations;
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

    // Get total count without cloning the entire vector
    let total = app_state.substations.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    // Calculate indices for the requested page
    let start_index = (params.page - 1) * params.per_page;
    let end_index = std::cmp::min(start_index + params.per_page, total);

    // Only clone the elements we need for this page
    let page_items = if start_index < total {
        app_state.substations[start_index..end_index].to_vec()
    } else {
        Vec::new()
    };

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

    // Find and clone only the specific substation needed
    let substation = app_state.substations.iter().find(|s| s.id == id).cloned();

    Ok(substation)
}
