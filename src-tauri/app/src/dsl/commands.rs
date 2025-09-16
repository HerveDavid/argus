use tauri::State;

use crate::nats::state::NatsState;

use super::error::Result;

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