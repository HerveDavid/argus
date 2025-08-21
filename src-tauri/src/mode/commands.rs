use super::entities::ModeCommand;
use super::error::Result;
use super::state::ModeState;

use crate::settings::database::state::DatabaseState;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn switch_mode(
    mode_state: State<'_, tokio::sync::Mutex<ModeState>>,
    settings_state: State<'_, tokio::sync::Mutex<DatabaseState>>,
    mode: ModeCommand,
) -> Result<()> {
    let new_mode = match mode {
        ModeCommand::Scada => ModeState::Scada,
        ModeCommand::GameMaster => ModeState::GameMaster,
        ModeCommand::Kpi => ModeState::Kpi,
    };

    let db_arc = settings_state.inner();
    ModeState::switch_to(mode_state.inner(), new_mode, db_arc).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_current_mode(
    mode_state: State<'_, tokio::sync::Mutex<ModeState>>,
) -> Result<ModeState> {
    let guard = ModeState::get(mode_state.inner()).await;
    Ok(guard.clone())
}