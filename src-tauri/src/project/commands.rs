use crate::settings::database::state::DatabaseState;

use super::entities::Project;
use super::error::{Error, Result};
use super::state::ProjectState;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;
use tauri::State;
use uuid::Uuid;

#[tauri::command(rename_all = "snake_case")]
pub async fn load_project(
    setting_state: State<'_, tokio::sync::Mutex<DatabaseState>>,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<Project> {
    let db = setting_state.lock().await;
    let project = project_state
        .lock()
        .await
        .repository
        .load_current_project(&db.pool)
        .await?;

    Ok(project)
}
