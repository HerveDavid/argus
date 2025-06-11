use tauri::State;
use tokio::sync::Mutex;

use crate::project::entities;
use crate::settings::database::state::DatabaseState;

use super::error::Result;
use super::state::ProjectState;

#[tauri::command]
pub async fn load_settings(
    project_state: State<'_, Mutex<ProjectState>>,
    settings_state: State<'_, Mutex<DatabaseState>>,
) -> Result<entities::Project> {
    let pool = &settings_state.lock().await.pool;
    project_state.lock().await.load_settings(pool).await
}