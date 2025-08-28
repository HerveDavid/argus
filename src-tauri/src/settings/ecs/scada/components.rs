use bevy::prelude::*;
use futures::StreamExt;
use log::{debug, error, info, warn};
use std::sync::Arc;

use crate::{
    nats::state::NatsState, settings::ecs::state::EcsState, tasks::state::TasksState,
    utils::tasks::CancellableTask,
};

use super::events::{FallbackMessage, LegacyMessage, ScadaMessage, ScadaOutput, TsTmMessage};

#[derive(Component)]
pub struct ScadaTask {
    scada_outputs: ScadaOutput,
}

impl ScadaTask {
    pub async fn new(
        tasks_state: Arc<tokio::sync::Mutex<TasksState>>,
        nats_state: tokio::sync::Mutex<NatsState>,
        ecs_state: Arc<tokio::sync::Mutex<EcsState>>,
        output: ScadaOutput,
    ) -> Self {
        let nats = nats_state.lock().await;
        let id = output.id.clone();

        let scada_outputs = output.clone();

        // if !nats.get_status().connected {
        //     return Err(Error::BrokerNotConnected);
        // }

        // let client = nats.get_client().ok_or(Error::ClientNotInitialized)?;

        let client = nats.get_client().unwrap();
        let ecs = ecs_state.clone();

        let task = CancellableTask::new({
            let id = id.clone();
            let destination = output.destination.clone();
            let local_topic = output.topic.clone();
            let sanitized_topic = local_topic.replace(".", "_");

            // Create full topic: HMI.<destination>.<sanitized_topic>
            let full_topic = format!("HMI.{}.{}", destination, sanitized_topic);

            move |cancellation_token| async move {
                // Subscribe to the topic
                let mut subscription = match client.subscribe(full_topic.clone()).await {
                    Ok(sub) => sub,
                    Err(e) => {
                        return;
                    }
                };

                loop {
                    tokio::select! {
                        Some(msg) = subscription.next() => {

                        match std::str::from_utf8(&msg.payload) {
                            Ok(payload_str) => {
                                debug!("Feeder '{}' received raw payload: {}", id, payload_str);

                                // Try to parse as JSON
                                match serde_json::from_str::<serde_json::Value>(payload_str) {
                                    Ok(parsed_json) => {
                                        // Process TS/TM format or Legacy format
                                        let processed_message = process_scada_message(
                                            &output,
                                            &parsed_json
                                        );

                                        debug!("Processed message for '{}': {:?}", id, processed_message);

                                        let mut guard = ecs.lock().await;
                                        guard.send(processed_message);
                                        guard.update();
                                    },
                                    Err(e) => {
                                        warn!("Failed to parse JSON payload for '{}': {} - Raw: {}",
                                              id, e, payload_str);

                                        // Send fallback message
                                        let fallback_message = ScadaMessage::Fallback(FallbackMessage {
                                            id: id.clone(),
                                            raw_payload: payload_str.to_string(),
                                            parse_error: e.to_string(),
                                        });

                                        let mut guard = ecs.lock().await;
                                        guard.send(fallback_message);
                                        guard.update();
                                    }
                                }
                            },
                            Err(e) => {
                                error!("Failed to decode message payload as UTF-8 for '{}': {}", id, e);
                            }
                        }
                        }
                        _ = cancellation_token.cancelled() => {
                            break
                        }
                    }
                }
            }
        });

        tasks_state.lock().await.add_task(id, task).unwrap();

        Self { scada_outputs }
    }
}

/// Process incoming SCADA message and format it for the frontend
fn process_scada_message(scada_output: &ScadaOutput, message: &serde_json::Value) -> ScadaMessage {
    let id = scada_output.id.clone();
    let dynawo_id = scada_output.dynawo_id.clone();
    let graphical_id = scada_output.graphical_id.clone();

    // Check if this is a TS/TM format message (has tase2 field)
    if let Some(tase2) = message.get("tase2").and_then(|v| v.as_str()) {
        // TS/TM format message
        let timestamp = message.get("ts").and_then(|v| v.as_u64()).unwrap_or(0);
        let cause = message
            .get("cause")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        let validity = message
            .get("validity")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        let operator_blocked = message
            .get("operatorBlocked")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let tfos = message
            .get("tfos")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Determine message type and extract values
        let (message_type, value, st_val) =
            if let Some(val) = message.get("value").and_then(|v| v.as_f64()) {
                // Télémesure (TM) - analog value
                ("TM".to_string(), Some(val), None)
            } else if let Some(st_value) = message.get("stVal") {
                // Télésignalisation (TS) - digital value
                ("TS".to_string(), None, Some(st_value.clone()))
            } else {
                // Default to TM with no value if neither is present
                ("TM".to_string(), None, None)
            };

        ScadaMessage::TsTm(TsTmMessage {
            id,
            dynawo_id,
            format: "TS_TM".to_string(),
            tase2: tase2.to_string(),
            graphical_id,
            timestamp,
            cause,
            validity,
            operator_blocked,
            message_type,
            value,
            st_val,
            tfos,
        })
    } else {
        // Legacy format message
        ScadaMessage::Legacy(LegacyMessage {
            id,
            dynawo_id,
            graphical_id,
            format: "Legacy".to_string(),
            value: message.get("value").cloned(),
            time_sent: message.get("time_sent").and_then(|v| v.as_f64()),
            time_received: message.get("time_received").and_then(|v| v.as_f64()),
            raw_message: message.clone(),
        })
    }
}
