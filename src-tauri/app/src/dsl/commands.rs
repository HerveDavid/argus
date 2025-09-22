use serde_json::json;
use tauri::State;
use tokio::fs;
use tokio::time::{timeout, Duration};

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

#[tauri::command(rename_all = "snake_case")]
pub async fn stop_orchestrator(
    nats_state: State<'_, tokio::sync::Mutex<NatsState>>,
) -> Result<String> {
    let nats = nats_state.lock().await;

    let client = nats.try_client()?;
    
    // Création du message JSON pour le stop
    let stop_message = json!({"status": "Stopped"});
    let message_bytes = stop_message.to_string().into_bytes();
    
    // Envoi avec demande de réponse (request/reply pattern)
    let response = timeout(
        Duration::from_secs(5),
        client.request("stop", message_bytes.into())
    )
    .await
    .map_err(|_| Error::TimeoutError("Timeout waiting for stop confirmation".into()))?
    .map_err(Error::RequestError)?;
    
    // Parse de la réponse JSON
    let response_str = String::from_utf8_lossy(&response.payload);
    let response_json: serde_json::Value = serde_json::from_str(&response_str)
        .map_err(|e| Error::InvalidResponseError(format!("Failed to parse JSON response: {}", e)))?;
    
    // Vérification du statut de la réponse
    match response_json.get("status") {
        Some(status) if status == "OK" => {
            log::info!("Orchestrator stopped successfully");
            Ok("Orchestrator stopped successfully".into())
        },
        Some(status) => {
            let error_msg = status.as_str()
                .unwrap_or("Unknown error format");
            log::error!("Stop failed: {}", error_msg);
            Err(Error::OperationError(format!("Stop failed: {}", error_msg)))
        },
        None => {
            log::error!("Response missing 'status' field");
            Err(Error::InvalidResponseError("Response missing 'status' field".into()))
        }
    }
}