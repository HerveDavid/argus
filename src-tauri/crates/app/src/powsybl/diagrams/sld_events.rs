use super::super::errors::PowsyblResult;
use crate::powsybl::errors::PowsyblError;
use crate::state::AppState;
use log::{debug, info};
use serde::{Deserialize, Serialize};
use tauri::State;
use zeromq::{Socket, SocketSend};

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenDj {
    pub equipement_id: String,
    pub value: String,
    pub event_string: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CloseDj {
    pub equipement_id: String,
    pub value: String,
    pub event_string: String,
}

// Fonction helper pour envoyer des messages JSON via ZMQ
async fn send_zmq_json<T: Serialize>(
    url: &str,
    data: &T,
) -> Result<(), Box<dyn std::error::Error>> {
    let json_data = serde_json::to_string(data)?;
    debug!("Sending JSON data via ZMQ: {}", json_data);

    let mut socket = zeromq::PubSocket::new();
    socket.connect(url).await?;

    // Attendre un court instant pour permettre la connexion
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Créer et envoyer le message
    socket.send(json_data.into()).await?;

    debug!("JSON message sent successfully");
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_open_dj(state: State<'_, AppState>, open_dj: OpenDj) -> PowsyblResult<()> {
    info!(
        "Sending OpenDj command for equipment: {}",
        open_dj.equipement_id
    );

    // Now send the JSON message without holding the lock
    send_zmq_json("tcp://127.0.0.1:5555", &open_dj)
        .await
        .map_err(|_| PowsyblError::LockError)?;

    info!(
        "OpenDj command sent successfully for equipment: {}",
        open_dj.equipement_id
    );
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_close_dj(state: State<'_, AppState>, close_dj: CloseDj) -> PowsyblResult<()> {
    info!(
        "Sending CloseDj command for equipment: {}",
        close_dj.equipement_id
    );

    // Now send the JSON message without holding the lock
    send_zmq_json("tcp://127.0.0.1:5555", &close_dj)
        .await
        .map_err(|_| PowsyblError::LockError)?;

    info!(
        "CloseDj command sent successfully for equipment: {}",
        close_dj.equipement_id
    );
    Ok(())
}
