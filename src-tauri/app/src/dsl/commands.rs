use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{nats::state::NatsState, settings::database::state::DatabaseState};

use super::error::Result;

#[derive(Serialize, Deserialize)]
struct Session {
    name: String,
    path: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn init_dsl_file(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
    settings_db: State<'_, tokio::sync::Mutex<DatabaseState>>,
) -> Result<String> {
    let nats = nats_state.lock().await;
    let db = settings_db.lock().await;

    if let Some(session) = db.get_setting::<Session>("session-current").await? {

        let client = nats.try_client()?;
        let file = format!("docs/orchestrator/examples/scenario_MQIS_NB/config_mapped.toml");
        client.publish("Start", file.into()).await?;
        log::info!("Orchestrator init");

        // if let Some(client) = nats.get_client() {
        //     let file = format!("docs/orchestrator/examples/scenario_MQIS_NB/config_mapped.toml");
        //     client.publish("Start", file.into()).await?;
        //     log::info!("Orchestrator init");
        // } else {
        //     log::error!("Whereis the client?")
        // }
    }

    

    Ok("Orchestrator init".into())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn start_scenario(nats_state: State<'_, tokio::sync::Mutex<NatsState>>) -> Result<()> {
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn stop_dsl_scenario(nats_state: State<'_, tokio::sync::Mutex<NatsState>>) -> Result<()> {
    Ok(())
}
