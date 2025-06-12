use crate::entities::iidm::Substation;
use crate::powsybl::entities::{FetchStatus, PaginatedResponse, PaginationParams};
use crate::powsybl::error::{PowsyblError, PowsyblResult};
use crate::powsybl::send_zmq_request;
use crate::powsybl::state::PowsyblState;

use tauri::State;

/// Get all substations from the API
#[tauri::command(rename_all = "snake_case")]
pub async fn get_substations(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
) -> PowsyblResult<Vec<Substation>> {
    // Send request to get network substations
    let result = send_zmq_request("get_network_substations", None).await?;
    let substations =
        if let Some(substations_arr) = result.get("substations").and_then(|s| s.as_array()) {
            substations_arr
                .iter()
                .filter_map(|s| serde_json::from_value(s.clone()).ok())
                .collect::<Vec<Substation>>()
        } else {
            return Err(PowsyblError::JsonParseError(
                "Failed to parse substations".to_string(),
            ));
        };
    // Update the state
    {
        let mut app_state = state.lock().await;
        app_state.substations.clear();
        for substation in &substations {
            app_state
                .substations
                .insert(substation.id.clone(), substation.clone());
        }
    }

    Ok(substations)
}

/// Load all substations from the ZMQ server and store them in the application state
#[tauri::command(rename_all = "snake_case")]
pub async fn load_substations(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
) -> PowsyblResult<FetchStatus> {
    let substations = get_substations(state).await?;

    Ok(FetchStatus {
        success: true,
        message: format!("Loaded {} substations sucessfully", substations.len()),
    })
}

/// Get paginated substations from application state (no ZMQ call)
#[tauri::command(rename_all = "snake_case")]
pub async fn get_paginated_substations(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    pagination: Option<PaginationParams>,
) -> PowsyblResult<PaginatedResponse<Vec<Substation>>> {
    // This function remains the same as it reads from local state
    let params = pagination.unwrap_or_default();
    let app_state = state.lock().await;

    let total = app_state.substations.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    let page_items: Vec<Substation> = app_state
        .substations
        .values()
        .skip((params.page - 1) * params.per_page)
        .take(params.per_page)
        .cloned()
        .collect();

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
pub async fn get_substation_by_id(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    id: String,
) -> PowsyblResult<Option<Substation>> {
    // This function remains the same as it reads from local state
    let app_state = state.lock().await;
    let substation = app_state.substations.get(&id).cloned();
    Ok(substation)
}

/// Search for substations in the application state and return paginated results
#[tauri::command(rename_all = "snake_case")]
pub async fn search_substations(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    query: String,
    pagination: Option<PaginationParams>,
    search_fields: Option<Vec<String>>,
) -> PowsyblResult<PaginatedResponse<Vec<Substation>>> {
    // This function remains the same as it reads from local state
    let params = pagination.unwrap_or_default();

    let fields = search_fields.unwrap_or_else(|| {
        vec![
            "name".to_string(),
            "country".to_string(),
            "tso".to_string(),
            "geo_tags".to_string(),
        ]
    });

    let app_state = state.lock().await;
    let query = query.to_lowercase();

    let filtered_substations: Vec<Substation> = app_state
        .substations
        .values()
        .filter(|substation| {
            if query.is_empty() {
                return true;
            }

            fields.iter().any(|field| match field.as_str() {
                "country" => substation.country.to_lowercase().contains(&query),
                "tso" => substation.tso.to_lowercase().contains(&query),
                "geo_tags" => substation.geo_tags.to_lowercase().contains(&query),
                "name" => substation.id.to_lowercase().contains(&query),
                _ => false,
            })
        })
        .cloned()
        .collect();

    let total = filtered_substations.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    let page_items: Vec<Substation> = filtered_substations
        .into_iter()
        .skip((params.page - 1) * params.per_page)
        .take(params.per_page)
        .collect();

    Ok(PaginatedResponse {
        items: page_items,
        total,
        page: params.page,
        per_page: params.per_page,
        total_pages,
    })
}
