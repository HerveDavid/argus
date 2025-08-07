use crate::entities::sld_metadata::SldMetadata;
use crate::settings::database::state::DatabaseState;

use super::entities::{DiagramResult, Project, QueryResponse};
use super::error::{Error, Result};
use super::state::ProjectState;

use serde_json::json;
use std::time::Duration;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn load_project(
    setting_state: State<'_, tokio::sync::Mutex<DatabaseState>>,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<Project> {
    let db = setting_state.lock().await;
    let project = {
        let mut project_state_guard = project_state.lock().await;
        project_state_guard
            .repository
            .load_current_project(&db.pool)
            .await?
    };

    log::debug!("Loaded project: {:?}", &project);

    let network_db_path = std::path::Path::new(&project.path).join("network.db");
    let db_exists = network_db_path.exists();

    log::debug!("Network DB exists: {}", db_exists);

    if !db_exists {
        let mut project_state_guard = project_state.lock().await;

        let params = json!({
            "config_path": project.config_path
        });

        let timeout = Duration::from_secs(30);

        match project_state_guard
            .database
            .send_request("load_config", Some(params), timeout)
            .await
        {
            Ok(response) => {
                log::debug!("Python load_config response: {:?}", response);

                if let Some(network_info) = response.get("network_load_result") {
                    log::info!("Network loaded successfully: {:?}", network_info);
                }

                if let Some(error) = response.get("network_load_error") {
                    log::warn!("Network load error: {:?}", error);
                }
            }
            Err(e) => {
                log::warn!("Failed to load config via Python: {:?}", e);
            }
        }
    } else {
        log::debug!("Network DB already exists, skipping load_config");
    }

    Ok(project)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn init_database_project(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    db_path: Option<String>,
) -> Result<String> {
    let mut project_state_guard = project_state.lock().await;

    let database_path = db_path.unwrap_or_else(|| "network.db".to_string());

    let timeout = Duration::from_secs(30);

    let set_db_params = json!({
        "db_path": database_path
    });

    project_state_guard
        .database
        .send_request("set_database", Some(set_db_params), timeout)
        .await?;

    log::debug!("Database path configured: {}", database_path);

    let reset_response = project_state_guard
        .database
        .send_request("reset_database", None, Duration::from_secs(60))
        .await?;

    log::info!("Database initialized successfully: {:?}", reset_response);

    Ok(database_path)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn query_project(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    query: String,
) -> Result<QueryResponse> {
    let mut project_state_guard = project_state.lock().await;

    let params = json!({
        "query": query
    });

    let timeout = Duration::from_secs(30);

    let response = project_state_guard
        .database
        .send_request("execute_query", Some(params), timeout)
        .await?;

    let columns = response
        .get("columns")
        .and_then(|c| c.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default();

    let data = response
        .get("data")
        .and_then(|d| d.as_array())
        .cloned()
        .unwrap_or_default();

    let row_count = response
        .get("row_count")
        .and_then(|r| r.as_u64())
        .unwrap_or(0) as usize;

    Ok(QueryResponse {
        columns,
        data,
        row_count,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_new_project(
    setting_state: State<'_, tokio::sync::Mutex<DatabaseState>>,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    name: String,
    path: String,
    config_path: String,
) -> Result<Project> {
    let db = setting_state.lock().await;
    let project_state_guard = project_state.lock().await;

    let new_project = Project {
        name,
        path,
        config_path,
        last_accessed: chrono::Utc::now(),
    };

    project_state_guard
        .repository
        .set_current_project(&db.pool, &new_project)
        .await?;

    log::info!("Created new project: {:?}", &new_project);

    Ok(new_project)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    element_id: String,
) -> Result<DiagramResult> {
    let mut project_state_guard = project_state.lock().await;

    let params = json!({
        "element_id": element_id,
        "format": "json"
    });

    log::debug!("get_single_line_diagram called, with args: {}", &params);

    let timeout = Duration::from_secs(30);

    let response = project_state_guard
        .database
        .send_request("get_single_line_diagram", Some(params), timeout)
        .await?;

    let svg = response
        .get("svg")
        .and_then(|s| s.as_str())
        .ok_or_else(|| Error::JsonParseError("Missing or invalid 'svg' field".to_string()))?
        .to_string();

    let metadata_value = response
        .get("metadata")
        .ok_or_else(|| Error::JsonParseError("Missing 'metadata' field".to_string()))?;

    let metadata: SldMetadata = serde_json::from_value(metadata_value.clone())
        .map_err(|e| Error::JsonParseError(format!("Failed to parse metadata: {}", e)))?;

    Ok(DiagramResult { svg, metadata })
}
