use std::collections::HashMap;
use tauri::State;

use crate::sessions::state::SessionState;

use super::super::entities::*;
use super::super::error::Result;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_tables(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
) -> Result<Vec<TableInfoResponse>> {
    let session = session_state.lock().await;
    let response = session.get::<Vec<TableInfoResponse>>("powsybl/tables").await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_table_data(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    table_name: String,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let mut endpoint = format!("powsybl/table/{}", table_name);
    let mut params = Vec::new();

    if let Some(limit_val) = limit {
        params.push(format!("limit={}", limit_val));
    }
    if let Some(offset_val) = offset {
        params.push(format!("offset={}", offset_val));
    }

    if !params.is_empty() {
        endpoint.push_str(&format!("?{}", params.join("&")));
    }

    let response = session.get::<QueryResponse>(&endpoint).await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn search_table(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    table_name: String,
    filters: String,
    limit: Option<i32>,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let mut endpoint = format!("powsybl/table/{}/search?filters={}", table_name, urlencoding::encode(&filters));

    if let Some(limit_val) = limit {
        endpoint.push_str(&format!("&limit={}", limit_val));
    }

    let response = session.get::<QueryResponse>(&endpoint).await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_item_by_id(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    table_name: String,
    item_id: String,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let endpoint = format!("powsybl/table/{}/item/{}", table_name, item_id);
    let response = session.get::<QueryResponse>(&endpoint).await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_database_stats(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
) -> Result<HashMap<String, serde_json::Value>> {
    let session = session_state.lock().await;
    let response = session.get::<HashMap<String, serde_json::Value>>("powsybl/stats").await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    element_id: String,
) -> Result<SingleLineDiagramResponse> {
    let session = session_state.lock().await;

    let endpoint = format!("powsybl/single_line_diagram/{}", element_id);
    let response = session.get::<SingleLineDiagramResponse>(&endpoint).await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_network_area_diagram(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    voltage_level_ids: Option<String>,
    depth: Option<i32>,
    high_nominal_voltage_bound: Option<f64>,
    low_nominal_voltage_bound: Option<f64>,
) -> Result<NetworkAreaDiagramResponse> {
    let session = session_state.lock().await;

    let mut endpoint = String::from("powsybl/network_area_diagram");
    let mut params = Vec::new();

    if let Some(vl_ids) = voltage_level_ids {
        params.push(format!("voltage_level_ids={}", urlencoding::encode(&vl_ids)));
    }
    if let Some(depth_val) = depth {
        params.push(format!("depth={}", depth_val));
    }
    if let Some(high_bound) = high_nominal_voltage_bound {
        params.push(format!("high_nominal_voltage_bound={}", high_bound));
    }
    if let Some(low_bound) = low_nominal_voltage_bound {
        params.push(format!("low_nominal_voltage_bound={}", low_bound));
    }

    if !params.is_empty() {
        endpoint.push_str(&format!("?{}", params.join("&")));
    }

    let response = session.get::<NetworkAreaDiagramResponse>(&endpoint).await?;
    Ok(response)
}
