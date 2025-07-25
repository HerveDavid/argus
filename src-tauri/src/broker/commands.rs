use async_nats::Message;
use futures::stream::StreamExt;
use log::{debug, info, warn};
use std::collections::HashMap;
use tauri::{ipc::Channel, State};
use tokio::sync::broadcast;

use crate::{
    shared::entities::dynawo::GameMasterOutput, sld_metadata::SldMetadata, state::AppState,
};

use super::{
    errors::{BrokerError, BrokerResult},
    state::BrokerState,
};

const TOPIC: &str = "GameMaster";

#[tauri::command(rename_all = "snake_case")]
pub async fn connect_broker(
    state: State<'_, BrokerState>,
    app: State<'_, AppState>,
    substation_id: String,
    metadata: SldMetadata,
    channel: Channel<HashMap<String, f64>>,
) -> BrokerResult<()> {
    // Vérifier d'abord si une connexion existe déjà pour cette sous-station
    let mut state = state.lock().await;
    if state.channels.contains_key(&substation_id) {
        info!(
            "Une connexion existe déjà pour '{}'. Réutilisation.",
            substation_id
        );
        return Ok(());
    }

    // Subscribe to topic
    let topic = format!("{}.{}", TOPIC, substation_id.replace(".", "_"));  // Sanitize substation_id before use as topic ('.' is a delimiter in NATS)
    let mut telemetry_subscription = state.client.subscribe(topic.clone()).await?;
    debug!("Subscribe to topic '{}'", topic);

    // Subscribe to special topic
    let mut time_subscription = state.client.subscribe("time").await?;
    let mut stop_subscription = state.client.subscribe("stop").await?;

    // Handler channel for stopping
    let (stop_tx, mut stop_rx) = broadcast::channel::<()>(1);

    // let state = app.try_read().unwrap();
    let outputs = match app.try_write() {
        Ok(guard) => {
            match &guard.settings.game_master_outputs {
                Some(game_outputs) => game_outputs.clone(),
                None => {
                    warn!("Game master outputs not initialized");
                    Vec::new() // Return empty vector
                }
            }
        }
        Err(err) => {
            warn!("Failed to acquire AppState lock: {:?}", err);
            Vec::new() // Return empty vector
        }
    };

    // let toto = app.try_read().unwrap();
    let task = tokio::spawn(async move {
        // Values state
        let mut telemetry_values: HashMap<String, f64> = HashMap::new();
        info!("Tâche de surveillance démarrée pour '{}'", topic);

        loop {
            tokio::select! {
                Some(msg) = telemetry_subscription.next() => {
                    let milliseconds_timestamp: u128 = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis();
                    debug!("Message de télémétrie reçu sur '{}' (time:{}): {:?}", topic, milliseconds_timestamp, &msg.payload);
                    process_telemetry_message(msg, &mut telemetry_values, &outputs);
                }
                Some(msg) = time_subscription.next() => {
                    if let Ok(time_str) = std::str::from_utf8(&msg.payload) {
                        if let Ok(time) = time_str.parse::<f64>() {
                            debug!("Message de temps reçu: {}", time);

                            if !telemetry_values.is_empty() {
                                match channel.send(telemetry_values.clone()) {
                                    Ok(_) => debug!("Données envoyées au canal ({} valeurs)", telemetry_values.len()),
                                    Err(e) => warn!("Erreur lors de l'envoi des données au canal: {}", e),
                                }
                            }
                        }
                    }
                }
                Some(msg) = stop_subscription.next() => {
                    if let Ok(payload) = std::str::from_utf8(&msg.payload) {
                        if payload == "stop" {
                            debug!("Message d'arrêt reçu sur le topic. Arrêt du client.");
                            break;
                        }
                    }
                }
                result = stop_rx.recv() => {
                    match result {
                        Ok(_) => debug!("Signal d'arrêt reçu. Arrêt du client."),
                        Err(e) => warn!("Erreur de réception du signal d'arrêt: {}", e),
                    }
                    break;
                }
            }
        }

        info!("Tâche de surveillance terminée pour '{}'", topic);
    });

    state
        .channels
        .insert(substation_id.clone(), (task, stop_tx));
    info!("Connexion établie pour la sous-station '{}'", substation_id);
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn disconnect_broker(
    state: State<'_, BrokerState>,
    substation_id: String,
) -> BrokerResult<()> {
    let mut state = state.lock().await;

    if let Some((task, stop_sender)) = state.channels.remove(&substation_id) {
        info!("Déconnexion de la sous-station '{}'", substation_id);

        // Envoyer le signal d'arrêt
        match stop_sender.send(()) {
            Ok(n) => debug!("Signal d'arrêt envoyé à {} récepteurs", n),
            Err(e) => warn!("Erreur lors de l'envoi du signal d'arrêt: {}", e),
        }

        // Attendre que la tâche se termine (optionnel, avec timeout)
        tokio::spawn(async move {
            match tokio::time::timeout(std::time::Duration::from_secs(5), task).await {
                Ok(result) => match result {
                    Ok(_) => debug!("Tâche terminée normalement"),
                    Err(e) => warn!("Erreur lors de la terminaison de la tâche: {}", e),
                },
                Err(_) => warn!("Timeout lors de l'attente de la terminaison de la tâche"),
            }
        });
    } else {
        debug!(
            "Aucune connexion trouvée pour la sous-station '{}'",
            substation_id
        );
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_command_broker(
    state: State<'_, BrokerState>,
    command: serde_json::Value,
) -> BrokerResult<()> {
    // Log when the function is called
    log::info!("send_command_broker called with command: {}", command);

    // Get a nats client
    let state = state.lock().await;
    let command_str = serde_json::to_string(&command)?;

    log::debug!("Publishing command to topic: {}{}", TOPIC, "Control");

    // Try to publish the message and log the result
    match state
        .client
        .publish(format!("{}{}", TOPIC, "Control"), command_str.into())
        .await
    {
        Ok(_) => {
            log::info!("Command successfully published to broker");
            Ok(())
        }
        Err(err) => {
            log::error!("Failed to publish command to broker: {}", err);
            Err(err.into())
        }
    }
}

fn process_telemetry_message(
    msg: Message,
    values: &mut HashMap<String, f64>,
    outputs: &Vec<GameMasterOutput>,
) {
    if let Ok(payload) = std::str::from_utf8(&msg.payload) {
        if let Some(index) = payload.find(':') {
            // Expected format is {"ID": VALUE}

            let (id, value_str) = payload.split_at(index);
            let id = &id[1..id.len()];

            let aa = find(outputs, id);

            if let Some(id) = aa {
                let value_str = &value_str[2..value_str.len() - 1];
                if let Ok(value) = value_str.parse::<f64>() {
                    values.insert(id.clone(), value);

                    println!("Télémétrie reçue: {} = {:.2}", id, value);
                }
            }
        }
    }
}

fn find(outputs: &Vec<GameMasterOutput>, id: &str) -> Option<String> {
    for o in outputs {
        if id.contains(&o.dynawo_id) {
            return o.graphical_id.clone();
        }
    }

    None
}

fn find_from_graphical_id(outputs: &Vec<GameMasterOutput>, graphical_id: &str) -> Option<String> {
    outputs
        .iter()
        .find(|o| o.graphical_id.as_ref().map_or(false, |g| g == graphical_id))
        .and_then(|o| o.equipment_id.clone())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_command_breaker(
    app: State<'_, AppState>,
    state: State<'_, BrokerState>,
    graphical_id: String,
    value: f64,
) -> BrokerResult<()> {
    // For ShardedLock, try_read() returns Result<Guard, TryLockError>
    let outputs = match app.try_read() {
        Ok(guard) => {
            match &guard.settings.game_master_outputs {
                Some(game_outputs) => {
                    log::debug!("Successfully acquired AppState read lock, found {} outputs", game_outputs.len());
                    game_outputs.clone()
                }
                None => {
                    warn!("Game master outputs not initialized");
                    return Err(BrokerError::StateError("Game master outputs not initialized".to_string()));
                }
            }
        }
        Err(_) => {
            warn!("Failed to acquire AppState read lock: WouldBlock");
            return Err(BrokerError::LockError("AppState read lock unavailable".to_string()));
        }
    };

    // Find the equipment ID from graphical ID
    let equipment_id = find_from_graphical_id(&outputs, &graphical_id)
        .ok_or_else(|| {
            warn!("Graphical ID not found: {}", graphical_id);
            BrokerError::ValidationError(format!("Graphical ID not found: {}", graphical_id))
        })?;

    // Create command JSON with the equipment ID as the key
    let command = serde_json::json!({
        equipment_id: value
    });

    // Get NATS client
    let state_guard = state.lock().await;
    let command_str = serde_json::to_string(&command)
        .map_err(|e| {
            log::error!("Failed to serialize command: {}", e);
            BrokerError::SerializationError(e)
        })?;

    let topic = format!("{}{}", TOPIC, "Control");
    log::debug!("Publishing command to topic: {}", topic);

    // Publish command
    match state_guard.client.publish(topic, command_str.into()).await {
        Ok(_) => {
            log::info!("Command successfully published to broker");
            Ok(())
        }
        Err(err) => {
            log::error!("Failed to publish command to broker: {}", err);
            Err(err.into())
        }
    }
}