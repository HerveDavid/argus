use async_nats::Message;
use futures::stream::StreamExt;
use log::debug;
use std::collections::HashMap;
use tauri::{ipc::Channel, State};
use tokio::sync::broadcast;

use crate::{broker::errors::BrokerError, state::AppState};

use super::errors::BrokerResult;

const ADDRESS: &str = "nats://localhost:4222";

#[tauri::command(rename_all = "snake_case")]
pub async fn connect_broker(
    state: State<'_, AppState>,
    substation_id: String,
    channel: Channel<HashMap<String, f64>>,
) -> BrokerResult<()> {
    let client = async_nats::connect(ADDRESS).await?;

    let mut telemetry_subscription = client
        .subscribe(format!("GameMaster.{}", substation_id))
        .await?;
    debug!("Subscribe to topic 'GameMaster.{}'", substation_id);
    let mut time_subscription = client.subscribe("time").await?;

    let mut stop_subscription = client.subscribe("stop").await?;

    let mut telemetry_values: HashMap<String, f64> = HashMap::new();
    let (stop_tx, stop_rx) = broadcast::channel::<()>(1);
    let mut stop_receiver = stop_rx;

    let task = tokio::spawn(async move {
        loop {
            tokio::select! {
                Some(msg) = telemetry_subscription.next() => {
                    process_telemetry_message(msg, &mut telemetry_values);
                }
                Some(msg) = time_subscription.next() => {
                    if let Ok(time_str) = std::str::from_utf8(&msg.payload) {
                        if let Ok(_) = time_str.parse::<u64>() {

                            if !telemetry_values.is_empty() {
                                channel.send(telemetry_values.clone()).unwrap();
                            }
                        }
                    }
                }
                Some(msg) = stop_subscription.next() => {
                    if let Ok(payload) = std::str::from_utf8(&msg.payload) {
                        if payload == "stop" {
                            debug!("Message d'arrêt reçu. Arrêt du client.");
                            break;
                        }
                    }
                }
                _ = stop_receiver.recv() => {
                    debug!("Signal d'arrêt reçu. Arrêt du client.");
                    break;
                }
            }
        }
    });

    let mut state_guard = state
        .try_write()
        .map_err(|e| BrokerError::LockError(e.to_string()))?;
    state_guard
        .broker
        .channels
        .insert(substation_id, (task, stop_tx));

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn disconnect_broker(
    state: State<'_, AppState>,
    substation_id: String,
) -> BrokerResult<()> {
    let mut state_guard = state
        .try_write()
        .map_err(|e| BrokerError::LockError(e.to_string()))?;

    if let Some((_, stop_sender)) = state_guard.broker.channels.get(&substation_id) {
        let _ = stop_sender.send(());
    }

    state_guard.broker.channels.remove(&substation_id);

    Ok(())
}

fn process_telemetry_message(msg: Message, values: &mut HashMap<String, f64>) {
    if let Ok(payload) = std::str::from_utf8(&msg.payload) {
        if let Some(index) = payload.find(':') {
            let (id, value_str) = payload.split_at(index);
            let value_str = &value_str[1..];

            if let Ok(value) = value_str.parse::<f64>() {
                values.insert(id.to_string(), value);
                println!("Télémétrie reçue: {} = {:.2}", id, value);
            }
        }
    }
}
