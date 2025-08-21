use super::error::Result;
use crate::settings::database::state::DatabaseState;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModeState {
    Scada,
    GameMaster,
    Kpi,
}

impl Default for ModeState {
    fn default() -> Self {
        ModeState::GameMaster
    }
}

impl ModeState {
    pub async fn new(settings_db: Arc<tokio::sync::Mutex<DatabaseState>>) -> Result<tokio::sync::Mutex<Self>> {
        let db_guard = settings_db.lock().await;
        let mode = db_guard
            .get_setting_or_default::<ModeState>("current-mode")
            .await?;
        drop(db_guard);

        let state = tokio::sync::Mutex::new(mode);
        Ok(state)
    }

    pub async fn switch_to_scada(
        mutex: &tokio::sync::Mutex<Self>,
        settings_db: &tokio::sync::Mutex<DatabaseState>
    ) -> Result<()> {
        let mut state = mutex.lock().await;
        *state = ModeState::Scada;
        let db_guard = settings_db.lock().await;
        db_guard.set_setting("current-mode", &*state).await?;
        Ok(())
    }

    pub async fn switch_to_game_master(
        mutex: &tokio::sync::Mutex<Self>,
        settings_db: &tokio::sync::Mutex<DatabaseState>
    ) -> Result<()> {
        let mut state = mutex.lock().await;
        *state = ModeState::GameMaster;
        let db_guard = settings_db.lock().await;
        db_guard.set_setting("current-mode", &*state).await?;
        Ok(())
    }

    pub async fn switch_to_kpi(
        mutex: &tokio::sync::Mutex<Self>,
        settings_db: &tokio::sync::Mutex<DatabaseState>
    ) -> Result<()> {
        let mut state = mutex.lock().await;
        *state = ModeState::Kpi;
        let db_guard = settings_db.lock().await;
        db_guard.set_setting("current-mode", &*state).await?;
        Ok(())
    }

    pub async fn switch_to(
        mutex: &tokio::sync::Mutex<Self>,
        new_mode: ModeState,
        settings_db: &tokio::sync::Mutex<DatabaseState>
    ) -> Result<()> {
        let mut state = mutex.lock().await;
        let db_guard = settings_db.lock().await;

        *state = new_mode.clone();
        db_guard.set_setting("current-mode", &new_mode).await?;

        Ok(())
    }

    pub async fn get(mutex: &tokio::sync::Mutex<Self>) -> tokio::sync::MutexGuard<'_, ModeState> {
        mutex.lock().await
    }
}