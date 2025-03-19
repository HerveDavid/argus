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

/// Retrieves substations with pagination from the API
#[tauri::command(rename_all = "snake_case")]
pub async fn get_paginated_substations(
    state: State<'_, AppState>,
    pagination: Option<PaginationParams>,
) -> NetworkResult<PaginatedResponse<Vec<Substation>>> {
    // Use pagination parameters or default values
    let params = pagination.unwrap_or_default();

    // Clone the client to avoid holding MutexGuard across await
    let client = {
        let app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.client.clone()
    };

    // Use the cloned client for the request with query parameters
    let response = client
        .get("http://localhost:8000/api/v1/network/substations")
        .query(&[
            ("page", params.page.to_string()),
            ("per_page", params.per_page.to_string()),
        ])
        .send()
        .await?;

    // Check for successful status code
    if !response.status().is_success() {
        return Err(NetworkError::ApiError(response.status().to_string()));
    }

    // Get the response text
    let text = response.text().await?;

    // Try to parse the response as a direct paginated response
    if let Ok(paginated_response) =
        serde_json::from_str::<PaginatedResponse<Vec<Substation>>>(&text)
    {
        // Update state with new substations
        {
            let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;

            // If it's the first page, reset the list
            if params.page == 1 {
                app_state.substations = paginated_response.items.clone();
            } else {
                // Otherwise, add new substations (avoiding duplicates)
                let existing_ids: std::collections::HashSet<_> =
                    app_state.substations.iter().map(|s| s.id.clone()).collect();

                for substation in &paginated_response.items {
                    if !existing_ids.contains(&substation.id) {
                        app_state.substations.push(substation.clone());
                    }
                }
            }
        }

        return Ok(paginated_response);
    }

    // If not a paginated response format, try other formats
    let all_substations = match serde_json::from_str::<Substations>(&text) {
        Ok(response) => {
            // Successfully parsed as a container
            response.substations
        }
        Err(_) => {
            // Try parsing as direct array of substations
            match serde_json::from_str::<Vec<Substation>>(&text) {
                Ok(substations) => substations,
                Err(e) => return Err(NetworkError::JsonParseError(e)),
            }
        }
    };

    // Calculate pagination manually
    let total = all_substations.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    // Extract the requested page
    let start_index = (params.page - 1) * params.per_page;
    let end_index = std::cmp::min(start_index + params.per_page, total);

    let page_items = if start_index < total {
        all_substations[start_index..end_index].to_vec()
    } else {
        Vec::new()
    };

    // Update application state
    {
        let mut app_state = state.lock().map_err(|_| NetworkError::LockError)?;
        app_state.substations = all_substations;
    }

    // Return the paginated response
    Ok(PaginatedResponse {
        items: page_items,
        total,
        page: params.page,
        per_page: params.per_page,
        total_pages,
    })
}
