use super::entities::{FetchStatus, PaginatedResponse, PaginationParams};
use super::errors::{PowsyblError, PowsyblResult};
use super::send_zmq_request;

use crate::state::AppState;

use entities::iidm::VoltageLevel;
use tauri::State;

/// Get all voltage levels from the ZMQ broker
#[tauri::command(rename_all = "snake_case")]
pub async fn get_voltage_levels(state: State<'_, AppState>) -> PowsyblResult<Vec<VoltageLevel>> {
    // Send request to get network voltage levels
    let result = send_zmq_request("get_network_voltage_levels", None).await?;
    let voltage_levels =
        if let Some(voltage_levels_arr) = result.get("voltage_levels").and_then(|s| s.as_array()) {
            voltage_levels_arr
                .iter()
                .filter_map(|s| serde_json::from_value(s.clone()).ok())
                .collect::<Vec<VoltageLevel>>()
        } else {
            return Err(PowsyblError::JsonParseError(
                "Failed to parse voltage levels".to_string(),
            ));
        };

    // Update the state
    {
        let mut app_state = state.write().map_err(|_| PowsyblError::LockError)?;
        app_state.powsybl.voltage_levels.clear();
        for voltage_level in &voltage_levels {
            app_state
                .powsybl
                .voltage_levels
                .insert(voltage_level.id.clone(), voltage_level.clone());
        }
    }

    Ok(voltage_levels)
}

/// Load all voltage levels from the ZMQ server and store them in the application state
#[tauri::command(rename_all = "snake_case")]
pub async fn load_voltage_levels(state: State<'_, AppState>) -> PowsyblResult<FetchStatus> {
    let voltage_levels = get_voltage_levels(state).await?;
    Ok(FetchStatus {
        success: true,
        message: format!(
            "Loaded {} voltage levels successfully",
            voltage_levels.len()
        ),
    })
}

/// Get paginated voltage levels from application state (no ZMQ call)
#[tauri::command(rename_all = "snake_case")]
pub fn get_paginated_voltage_levels(
    state: State<'_, AppState>,
    pagination: Option<PaginationParams>,
) -> PowsyblResult<PaginatedResponse<Vec<VoltageLevel>>> {
    // Use pagination parameters or default values
    let params = pagination.unwrap_or_default();

    // Access state with a lock
    let app_state = state.read().map_err(|_| PowsyblError::LockError)?;

    // Get total count directly from HashMap size
    let total = app_state.powsybl.voltage_levels.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    // Collect only the needed items for the current page
    let page_items: Vec<VoltageLevel> = app_state
        .powsybl
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
) -> PowsyblResult<Option<VoltageLevel>> {
    let app_state = state.read().map_err(|_| PowsyblError::LockError)?;

    // Directly get the voltage level from the HashMap by ID and clone it
    let voltage_level = app_state.powsybl.voltage_levels.get(&id).cloned();

    Ok(voltage_level)
}

/// Get voltage levels for a specific substation
#[tauri::command(rename_all = "snake_case")]
pub async fn get_voltage_levels_for_substation(
    substation_id: String,
) -> PowsyblResult<Vec<VoltageLevel>> {
    // Create parameters for the request
    let params = serde_json::json!({
        "substation_id": substation_id
    });

    // Send request to get voltage levels for a specific substation
    let result = send_zmq_request("get_voltage_levels_for_substation", Some(params)).await?;

    let voltage_levels =
        if let Some(voltage_levels_arr) = result.get("voltage_levels").and_then(|s| s.as_array()) {
            voltage_levels_arr
                .iter()
                .filter_map(|s| serde_json::from_value(s.clone()).ok())
                .collect::<Vec<VoltageLevel>>()
        } else {
            return Err(PowsyblError::JsonParseError(
                "Failed to parse voltage levels for substation".to_string(),
            ));
        };

    Ok(voltage_levels)
}

/// Search for voltage levels in the application state and return paginated results
#[tauri::command(rename_all = "snake_case")]
pub fn search_voltage_levels(
    state: State<'_, AppState>,
    query: String,
    pagination: Option<PaginationParams>,
    search_fields: Option<Vec<String>>,
) -> PowsyblResult<PaginatedResponse<Vec<VoltageLevel>>> {
    let params = pagination.unwrap_or_default();

    let fields = search_fields.unwrap_or_else(|| {
        vec![
            "name".to_string(),
            "id".to_string(),
            "substation_id".to_string(),
            "topology_kind".to_string(),
        ]
    });

    let app_state = state.read().map_err(|_| PowsyblError::LockError)?;
    let query = query.to_lowercase();

    let filtered_voltage_levels: Vec<VoltageLevel> = app_state
        .powsybl
        .voltage_levels
        .values()
        .filter(|voltage_level| {
            if query.is_empty() {
                return true;
            }

            fields.iter().any(|field| match field.as_str() {
                "id" => voltage_level.id.to_lowercase().contains(&query),
                "name" => voltage_level.name.to_lowercase().contains(&query),
                "substation_id" => voltage_level.substation_id.to_lowercase().contains(&query),
                "topology_kind" => voltage_level.topology_kind.to_lowercase().contains(&query),
                _ => false,
            })
        })
        .cloned()
        .collect();

    let total = filtered_voltage_levels.len();
    let total_pages = (total + params.per_page - 1) / params.per_page;

    let page_items: Vec<VoltageLevel> = filtered_voltage_levels
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
