use super::entities::{FetchStatus, PaginatedResponse, PaginationParams};
use super::errors::{PowsyblError, PowsyblResult};

use crate::shared::entities::iidm::{Substation, Substations};
use crate::state::AppState;

use tauri::State;

/// Get all substations from the API
#[tauri::command(rename_all = "snake_case")]
pub async fn get_substations(state: State<'_, AppState>) -> PowsyblResult<Vec<Substation>> {
    // Clone the client and check for server_url
    let (client, server_url) = {
        let app_state = state.read().map_err(|_| PowsyblError::LockError)?;
        let server_url = app_state
            .settings
            .server_url
            .clone()
            .ok_or(PowsyblError::ServerUrlNotConfigured)?;
        (app_state.settings.client.clone(), server_url)
    };

    // Use the cloned client for the request with server_url
    let response = client
        .get(format!("{}/api/v1/network/substations", server_url))
        .send()
        .await?;

    // Check for successful status code
    if !response.status().is_success() {
        return Err(PowsyblError::ApiError(response.status().to_string()));
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
        let mut app_state = state.write().map_err(|_| PowsyblError::LockError)?;
        // Clear existing substations and add new ones
        app_state.powsybl.substations.clear();
        for substation in &substations {
            app_state
                .powsybl
                .substations
                .insert(substation.id.clone(), substation.clone());
        }
    }

    // Return Vec<Substation> for backward compatibility
    Ok(substations)
}

/// Load all substations from the API and store them in the application state
#[tauri::command(rename_all = "snake_case")]
pub async fn load_substations(state: State<'_, AppState>) -> PowsyblResult<FetchStatus> {
    // Clone the client and check for server_url
    let (client, server_url) = {
        let app_state = state.read().map_err(|_| PowsyblError::LockError)?;
        let server_url = app_state
            .settings
            .server_url
            .clone()
            .ok_or(PowsyblError::ServerUrlNotConfigured)?;
        (app_state.settings.client.clone(), server_url)
    };

    // Use the cloned client for the request with server_url
    let response = client
        .get(format!("{}/api/v1/network/substations", server_url))
        .send()
        .await?;

    // Check for successful status code
    if !response.status().is_success() {
        return Err(PowsyblError::ApiError(response.status().to_string()));
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
        let mut app_state = state.write().map_err(|_| PowsyblError::LockError)?;
        // Clear existing substations and add new ones
        app_state.powsybl.substations.clear();
        for substation in substations {
            app_state
                .powsybl
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
) -> PowsyblResult<PaginatedResponse<Vec<Substation>>> {
    // Use pagination parameters or default values
    let params = pagination.unwrap_or_default();

    // Access state with a lock
    let app_state = state.read().map_err(|_| PowsyblError::LockError)?;

    // Get total count directly from HashMap size
    let total = app_state.powsybl.substations.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    // Collect only the needed items for the current page
    let page_items: Vec<Substation> = app_state
        .powsybl
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
) -> PowsyblResult<Option<Substation>> {
    let app_state = state.read().map_err(|_| PowsyblError::LockError)?;

    // Directly get the substation from the HashMap by ID and clone it
    let substation = app_state.powsybl.substations.get(&id).cloned();

    Ok(substation)
}

/// Search for substations in the application state and return paginated results
#[tauri::command(rename_all = "snake_case")]
pub fn search_substations(
    state: State<'_, AppState>,
    query: String,
    pagination: Option<PaginationParams>,
    search_fields: Option<Vec<String>>,
) -> PowsyblResult<PaginatedResponse<Vec<Substation>>> {
    // Use pagination parameters or default values
    let params = pagination.unwrap_or_default();

    // Default search fields if none provided
    let fields = search_fields.unwrap_or_else(|| {
        vec![
            "name".to_string(),
            "country".to_string(),
            "tso".to_string(),
            "geo_tags".to_string(),
        ]
    });

    // Access state with a lock
    let app_state = state.read().map_err(|_| PowsyblError::LockError)?;

    // Convert query to lowercase for case-insensitive search
    let query = query.to_lowercase();

    // Filter substations based on search query
    let filtered_substations: Vec<Substation> = app_state
        .powsybl
        .substations
        .values()
        .filter(|substation| {
            // If query is empty, return all substations
            if query.is_empty() {
                return true;
            }

            // Check if any of the specified fields contain the query
            // todo seach wit id also
            fields.iter().any(|field| match field.as_str() {
                // "name" => substation.name.to_lowercase().contains(&query),
                "country" => substation.country.to_lowercase().contains(&query),
                "tso" => substation.tso.to_lowercase().contains(&query),
                "geo_tags" => substation.geo_tags.to_lowercase().contains(&query),
                "name" => substation.id.to_lowercase().contains(&query),
                _ => false,
            })
        })
        .cloned()
        .collect();

    // Calculate pagination values
    let total = filtered_substations.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    // Get items for current page
    let page_items: Vec<Substation> = filtered_substations
        .into_iter()
        .skip((params.page - 1) * params.per_page)
        .take(params.per_page)
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
