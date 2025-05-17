use std::{fs, path::Path};

use super::errors::{SettingResult, SettingsError};
use crate::{shared::entities::dynawo::GameMasterOutputs, state::AppState};
use serde::Serialize;
use tauri::State;
use toml::Value;

#[derive(Debug, Serialize)]
pub struct ConfigResponse {
    pub status: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_config_file(
    state: State<'_, AppState>,
    config_path: String,
) -> SettingResult<ConfigResponse> {
    // Lock the state with error handling
    let mut app_state = state
        .write()
        .map_err(|e| SettingsError::StateLock(e.to_string()))?;

    if config_path.is_empty() {
        return Err(SettingsError::InvalidPath("Config path is empty".into()));
    }

    let config_path = Path::new(&config_path);
    if !config_path.exists() {
        return Err(SettingsError::FileNotFound(
            config_path.to_string_lossy().to_string(),
        ));
    }

    let path = Path::new(&config_path);
    if !path.exists() {
        return Err(SettingsError::FileNotFound(
            config_path.to_string_lossy().to_string(),
        ));
    }

    let toml_content =
        fs::read_to_string(config_path).map_err(|e| SettingsError::FileRead(e.to_string()))?;

    let parsed_toml: Value =
        toml::from_str(&toml_content).map_err(|e| SettingsError::Deserialization(e.to_string()))?;

    let outputs_file_rel_path = parsed_toml
        .get("input_files")
        .and_then(|input_files| input_files.get("dynawo_game_master_outputs_file"))
        .and_then(|file_path| file_path.as_str())
        .ok_or_else(|| {
            SettingsError::InvalidConfig("Missing dynawo_game_master_outputs_file in config".into())
        })?;

    let parent_dir = config_path.parent().ok_or_else(|| {
        SettingsError::InvalidPath("Cannot get parent directory of config file".into())
    })?;
    let outputs_file_abs_path = parent_dir.join(outputs_file_rel_path);

    if !outputs_file_abs_path.exists() {
        return Err(SettingsError::FileNotFound(
            outputs_file_abs_path.to_string_lossy().to_string(),
        ));
    }

    let content = fs::read_to_string(&outputs_file_abs_path)
        .map_err(|e| SettingsError::FileRead(e.to_string()))?;

    let game_master_outputs: GameMasterOutputs = serde_json::from_str(&content)
        .map_err(|e| SettingsError::Deserialization(e.to_string()))?;

    app_state.settings.game_master_outputs = Some(game_master_outputs);

    Ok(ConfigResponse {
        status: "configured".into(),
    })
}
