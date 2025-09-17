use tauri::State;
use tokio::fs;

use crate::nats::state::NatsState;

use super::error::{Error, Result};

#[tauri::command(rename_all = "snake_case")]
pub async fn start_dsl_file(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<String> {
    let nats = nats_state.lock().await;

    let client = nats.try_client()?;
    let file = format!("docs/orchestrator/examples/scenario_MQIS_NB/config_mapped.toml");
    client.publish("Start", file.into()).await?;
    log::info!("Orchestrator init");

    Ok("Orchestrator init".into())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_dsl_file(file_path: String) -> Result<String> {
    let content = fs::read_to_string(&file_path)
        .await
        .map_err(|e| Error::FileReadError(file_path, e))?;

    Ok(content)
}
