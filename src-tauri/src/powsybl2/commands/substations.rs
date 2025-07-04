use crate::entities::iidm::Substation;
use crate::powsybl::entities::{FetchStatus, PaginatedResponse, PaginationParams};
use crate::powsybl::error::{PowsyblError, PowsyblResult};
use crate::powsybl::state::PowsyblState;
use std::time::Duration;
use tauri::State;

/// Get all substations from the API via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn get_substations(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
) -> PowsyblResult<Vec<Substation>> {
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Send request to get network substations via PowsyblState
    let result = powsybl_state
        .send_request(
            "get_network_substations", 
            None, 
            Duration::from_secs(30)
        )
        .await?;
    
    let substations = if let Some(substations_arr) = result.get("substations").and_then(|s| s.as_array()) {
        substations_arr
            .iter()
            .filter_map(|s| serde_json::from_value(s.clone()).ok())
            .collect::<Vec<Substation>>()
    } else {
        return Err(PowsyblError::JsonParseError(
            "Failed to parse substations".to_string(),
        ));
    };
    
    // Update the state with the new substations
    powsybl_state.substations.clear();
    for substation in &substations {
        powsybl_state
            .substations
            .insert(substation.id.clone(), substation.clone());
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
        message: format!("Loaded {} substations successfully", substations.len()),
    })
}

/// Get paginated substations from application state (no ZMQ call)
#[tauri::command(rename_all = "snake_case")]
pub async fn get_paginated_substations(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    pagination: Option<PaginationParams>,
) -> PowsyblResult<PaginatedResponse<Vec<Substation>>> {
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

/// Get a specific substation by ID from application state
#[tauri::command(rename_all = "snake_case")]
pub async fn get_substation_by_id(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    id: String,
) -> PowsyblResult<Option<Substation>> {
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

/// Upload an IIDM file via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn upload_iidm_file(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    file_data: Vec<u8>,
    filename: String,
) -> PowsyblResult<String> {
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Encode file data to base64
    let file_data_b64 = base64::encode(&file_data);
    
    let params = serde_json::json!({
        "file_data": file_data_b64,
        "filename": filename
    });
    
    log::debug!("Uploading IIDM file: {}", filename);
    
    // Send ZMQ request via PowsyblState
    let result = powsybl_state
        .send_request(
            "upload_iidm", 
            Some(params), 
            Duration::from_secs(60) // Timeout plus long pour l'upload
        )
        .await?;
    
    // Extract status message
    let status = result
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("File uploaded successfully")
        .to_string();
    
    log::debug!("IIDM file upload completed: {}", status);
    
    Ok(status)
}

/// Get current network information via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn get_current_network_info(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
) -> PowsyblResult<serde_json::Value> {
    log::debug!("Getting current network info");
    
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Send ZMQ request via PowsyblState
    let result = powsybl_state
        .send_request(
            "get_current_network_info", 
            None, 
            Duration::from_secs(30)
        )
        .await?;
    
    log::debug!("Network info retrieved successfully");
    
    Ok(result)
}

/// Get network JSON via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn get_network_json(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
) -> PowsyblResult<serde_json::Value> {
    log::debug!("Getting network JSON");
    
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Send ZMQ request via PowsyblState
    let result = powsybl_state
        .send_request(
            "get_network_json", 
            None, 
            Duration::from_secs(30)
        )
        .await?;
    
    log::debug!("Network JSON retrieved successfully");
    
    Ok(result)
}

/// Get all network voltage levels via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn get_network_voltage_levels(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
) -> PowsyblResult<serde_json::Value> {
    log::debug!("Getting network voltage levels");
    
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Send ZMQ request via PowsyblState
    let result = powsybl_state
        .send_request(
            "get_network_voltage_levels", 
            None, 
            Duration::from_secs(30)
        )
        .await?;
    
    log::debug!("Network voltage levels retrieved successfully");
    
    Ok(result)
}

/// Get voltage levels for a specific substation via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn get_voltage_levels_for_substation(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    substation_id: String,
) -> PowsyblResult<serde_json::Value> {
    let params = serde_json::json!({
        "substation_id": substation_id
    });
    
    log::debug!("Getting voltage levels for substation: {}", substation_id);
    
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Send ZMQ request via PowsyblState
    let result = powsybl_state
        .send_request(
            "get_voltage_levels_for_substation", 
            Some(params), 
            Duration::from_secs(30)
        )
        .await?;
    
    log::debug!("Voltage levels for substation retrieved successfully");
    
    Ok(result)
}