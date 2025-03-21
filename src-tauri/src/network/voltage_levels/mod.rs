use super::errors::NetworkError;

use crate::network::entities::*;
use crate::network::errors::NetworkResult;
use crate::state::AppState;

use tauri::State;

/// Get all voltage levels from the API
#[tauri::command(rename_all = "snake_case")]
pub async fn get_voltage_levels(state: State<'_, AppState>) -> NetworkResult<Vec<VoltageLevel>> {
    // Clone the client and check for server_url
    let (client, server_url) = {
        let app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        let server_url = app_state
            .settings
            .server_url
            .clone()
            .ok_or(NetworkError::ServerUrlNotConfigured)?;
        (app_state.settings.client.clone(), server_url)
    };

    // Use the cloned client for the request with server_url
    let response = client
        .get(format!("{}/api/v1/network/voltage-levels", server_url))
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

    // Convert to HashMap and update the app state
    {
        let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        // Clear existing voltage levels and add new ones
        app_state.network.voltage_levels.clear();
        for voltage_level in &voltage_levels {
            app_state
                .network
                .voltage_levels
                .insert(voltage_level.id.clone(), voltage_level.clone());
        }
    }

    // Return Vec<VoltageLevel> for backward compatibility
    Ok(voltage_levels)
}

/// Load all voltage levels from the API and store them in the application state
#[tauri::command(rename_all = "snake_case")]
pub async fn load_voltage_levels(state: State<'_, AppState>) -> NetworkResult<FetchStatus> {
    // Clone the client and check for server_url
    let (client, server_url) = {
        let app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        let server_url = app_state
            .settings
            .server_url
            .clone()
            .ok_or(NetworkError::ServerUrlNotConfigured)?;
        (app_state.settings.client.clone(), server_url)
    };

    // Use the cloned client for the request with server_url
    let response = client
        .get(format!("{}/api/v1/network/voltage-levels", server_url))
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

    // Convert to HashMap and update the app state
    {
        let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        // Clear existing voltage levels and add new ones
        app_state.network.voltage_levels.clear();
        for voltage_level in voltage_levels {
            app_state
                .network
                .voltage_levels
                .insert(voltage_level.id.clone(), voltage_level);
        }
    }

    Ok(FetchStatus {
        success: true,
        message: "Voltage levels loaded successfully".to_string(),
    })
}

/// Get paginated voltage levels from application state (no API call)
#[tauri::command(rename_all = "snake_case")]
pub fn get_paginated_voltage_levels(
    state: State<'_, AppState>,
    pagination: Option<PaginationParams>,
) -> NetworkResult<PaginatedResponse<Vec<VoltageLevel>>> {
    // Use pagination parameters or default values
    let params = pagination.unwrap_or_default();

    // Access state with a lock
    let app_state = state.lock().map_err(|_| NetworkError::LockError)?;

    // Get total count directly from HashMap size
    let total = app_state.network.voltage_levels.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    // Collect only the needed items for the current page
    let page_items: Vec<VoltageLevel> = app_state
        .network
        .voltage_levels
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

/// Get a specific voltage level by ID
#[tauri::command(rename_all = "snake_case")]
pub fn get_voltage_levels_by_id(
    state: State<'_, AppState>,
    id: String,
) -> NetworkResult<Option<VoltageLevel>> {
    let app_state = state.lock().map_err(|_| NetworkError::LockError)?;

    // Directly get the voltage level from the HashMap by ID and clone it
    let voltage_level = app_state.network.voltage_levels.get(&id).cloned();

    Ok(voltage_level)
}
