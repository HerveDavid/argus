use tauri::State;

use crate::sessions::entities::RootConfig;

use super::error::{Error, Result};
use super::state::SessionState;


#[tauri::command(rename_all = "snake_case")]
pub async fn set_session_config(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    name: String,
    path: String,
) -> Result<RootConfig> {
    let session = session_state.lock().await;

    let form = reqwest::multipart::Form::new()
        .text("name", name.clone())
        .text("path", path.clone());

    let response = session.post_multipart::<RootConfig>("sessions/config", form).await?;

    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_session_config_with_file(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    name: String,
    path: Option<String>,
    file_path: String,
    base_directory: Option<String>,
) -> Result<RootConfig> {
    let session = session_state.lock().await;

    let file_content = std::fs::read(&file_path)
        .map_err(|e| Error::ClientError {
            message: format!("Failed to read file {}: {}", file_path, e)
        })?;

    let file_name = std::path::Path::new(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("config.toml");

    let response = session.post_multipart_with_file::<RootConfig>(
        "sessions/config",
        name,
        path,
        file_content,
        file_name,
        base_directory
    ).await?;

    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_session_status(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
) -> Result<RootConfig> {
    let session = session_state.lock().await;
    let response = session.get::<RootConfig>("sessions/config/status").await?;

    Ok(response)
}
