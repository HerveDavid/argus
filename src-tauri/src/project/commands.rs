use log::{debug, info};
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
    debug!("load_project command called");

    let pool = &settings_state.lock().await.pool;
    let result = project_state.lock().await.load_project(pool).await;

    if let Ok(project) = &result {
        info!("Project loaded: {}", project.path);
    }

    result
}

#[tauri::command]
pub async fn clean_project(project_state: State<'_, Mutex<ProjectState>>) -> Result<()> {
    debug!("clean_project command called");
    
    project_state.lock().await.clean_project().await?;
    Ok(())
}

#[tauri::command]
pub async fn is_loaded(project_state: State<'_, Mutex<ProjectState>>) -> Result<bool> {
    debug!("is_loaded command called");

    Ok(project_state.lock().await.is_loaded())
}

#[tauri::command]
pub async fn get_project(
    project_state: State<'_, Mutex<ProjectState>>,
) -> Result<Option<entities::Project>> {
    debug!("get_project command called");

    let project = project_state.lock().await.get_project().map(|f| f.clone());
    Ok(project)
}
