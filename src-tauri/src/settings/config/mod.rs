use std::{fs, path::Path};

use super::{
    errors::{SettingResult, SettingsError},
    get_setting, save_setting,
};
use crate::{
    database::DatabaseState,
    shared::{
        entities::{
            dynawo::GameMasterOutput,
            iidm::{Substation, VoltageLevel},
        },
        utils::InsertExt,
    },
    state::AppState,
};
use serde::Serialize;
use tauri::State;
use toml::Value;

#[derive(Debug, Serialize)]
pub struct ConfigResponse {
    pub status: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_config_file(
    state: State<'_, DatabaseState>,
    config_path: String,
) -> SettingResult<ConfigResponse> {
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

    let config = serde_json::json!({
       "dynawo_game_master_outputs_file": outputs_file_abs_path
    });

    let state = state.lock().await;
    save_setting(&state.pool, "config", &config).await?;

    Ok(ConfigResponse {
        status: "configured".into(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_iidm_file(
    state: State<'_, DatabaseState>,
    iidm_path: String,
) -> SettingResult<ConfigResponse> {
    if iidm_path.is_empty() {
        return Err(SettingsError::InvalidPath("IIDM path is empty".into()));
    }

    let config_path = Path::new(&iidm_path);
    if !config_path.exists() {
        return Err(SettingsError::FileNotFound(
            config_path.to_string_lossy().to_string(),
        ));
    }

    let config = serde_json::json!({
       "iidm_path": config_path
    });

    let state = state.lock().await;
    save_setting(&state.pool, "iidm", &config).await?;

    Ok(ConfigResponse {
        status: "configured".into(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_voltage_levels_in_db(
    db_state: State<'_, DatabaseState>,
    voltage_levels: Vec<VoltageLevel>,
) -> SettingResult<()> {
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_substations_in_db(
    db_state: State<'_, DatabaseState>,
    substations: Vec<Substation>,
) -> SettingResult<()> {
    Ok(())
}

use log::{debug, info, warn};
use std::time::Instant;

#[tauri::command(rename_all = "snake_case")]
pub async fn load_game_master_outputs_in_db(
    db_state: State<'_, DatabaseState>,
    app_state: State<'_, AppState>,
) -> SettingResult<ConfigResponse> {
    let start = Instant::now();
    let state = db_state.lock().await;

    if let Some(config) = get_setting(&state.pool, "config").await? {
        let path = config["dynawo_game_master_outputs_file"].as_str().unwrap();
        info!("Chargement du fichier de sorties Game Master: {}", path);

        // Mesurer le temps de lecture du fichier
        let file_start = Instant::now();
        let content =
            fs::read_to_string(path).map_err(|e| SettingsError::FileRead(e.to_string()))?;
        debug!(
            "Fichier lu en {:?}, taille: {} bytes",
            file_start.elapsed(),
            content.len()
        );

        // Mesurer le temps de désérialisation
        let deser_start = Instant::now();
        let game_master_outputs: Vec<GameMasterOutput> = serde_json::from_str(&content)
            .map_err(|e| SettingsError::Deserialization(e.to_string()))?;
        let count = game_master_outputs.len();
        info!(
            "Désérialisation de {} sorties Game Master terminée en {:?}",
            count,
            deser_start.elapsed()
        );

        // Log avant l'insertion
        info!(
            "Début de l'insertion de {} éléments dans la base de données...",
            count
        );

        // Mesurer le temps d'insertion
        let insert_start = Instant::now();

        // Implémenter la fonction d'insertion optimisée ici
        // Si vous utilisez l'implémentation que j'ai fournie, elle affichera ses propres logs
        // game_master_outputs.insert(&state.pool).await?;

        let mut state = app_state.try_write().unwrap();
        println!("GAME MASTER OUTPUS LEN : {}", &game_master_outputs.len());
        state.settings.game_master_outputs = Some(game_master_outputs);


        return Ok(ConfigResponse {
            status: format!("configuré avec {} sorties Game Master", count),
        });
    } else {
        warn!("Aucun fichier de configuration trouvé pour les sorties Game Master");
        return Ok(ConfigResponse {
            status: "no file yet".to_string(),
        });
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_feeder_info_in_db(
    db_state: State<'_, DatabaseState>,
    game_master_outputs: Vec<GameMasterOutput>,
) -> SettingResult<()> {
    Ok(())
}
