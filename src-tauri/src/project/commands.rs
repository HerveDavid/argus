use log::info;
use tauri::State;
use tokio::sync::Mutex;

use crate::project::entities;
use crate::settings::database::state::DatabaseState;

use super::error::Result;
use super::state::ProjectState;

#[tauri::command]
pub async fn load_project(
    project_state: State<'_, Mutex<ProjectState>>,
    settings_state: State<'_, Mutex<DatabaseState>>,
) -> Result<entities::Project> {

    info!("load_project command called");

    let pool = &settings_state.lock().await.pool;
    let result = project_state.lock().await.load_project(pool).await;

    if let Ok(project) = &result {
        info!("Project loaded: {}", project.path);
    }

    result
}