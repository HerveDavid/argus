use crate::utils::tasks::CancellableTask;
use crate::scada::entities::ScadaOutput;

use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use log::{debug, info, warn, error};
use futures::StreamExt;
use serde_json::{json, Value};
use tauri::ipc::Channel;

pub fn create_task_feeder(
    client: Arc<async_nats::Client>,
    channel: Channel<serde_json::Value>,
    scada_output: ScadaOutput,
) -> CancellableTask<()> {

    // Flag for pausing feeder
    let paused = Arc::new(AtomicBool::new(false));

    // Create cancellable task for this NATS subscription
    CancellableTask::new({

        let id = scada_output.id.clone();
        let destination = scada_output.destination.clone();
        let local_topic = scada_output.topic.clone();

        // Sanitize the local topic (replace dots with underscores)
        let sanitized_topic = local_topic.replace(".", "_");

        // Create full topic: HMI.<destination>.<sanitized_topic>
        let full_topic = format!("HMI.{}.{}", destination, sanitized_topic);

        move |cancellation_token| async move {
            // Subscribe to the topic
            let mut subscription = match client.subscribe(full_topic.clone()).await {
                Ok(sub) => sub,
                Err(e) => {
                    error!("Failed to subscribe to topic '{}': {}", full_topic, e);
                    return;
                }
            };

            info!(
                "Successfully subscribed to topic '{}' for SCADA output '{}' (dynawo_id: {})",
                full_topic,
                id,
                scada_output.dynawo_id
            );

            // Main message processing loop
            loop {
                tokio::select! {
                    // Handle incoming messages
                    Some(msg) = subscription.next() => {
                        if paused.load(Ordering::Relaxed) {
                            debug!("Feeder '{}' is paused, skipping message", id);
                            continue;
                        }

                        // Parse the message payload
                        match std::str::from_utf8(&msg.payload) {
                            Ok(payload_str) => {
                                debug!("Feeder '{}' received raw payload: {}", id, payload_str);

                                // Try to parse as JSON
                                match serde_json::from_str::<Value>(payload_str) {
                                    Ok(parsed_json) => {
                                        // Process TS/TM format or Legacy format
                                        let processed_event = process_scada_message(
                                            &scada_output,
                                            &parsed_json
                                        );

                                        debug!("Processed event for '{}': {:?}", id, processed_event);

                                        if let Err(e) = channel.send(processed_event) {
                                            warn!("Failed to send event to channel for '{}': {:?}", id, e);
                                        }
                                    },
                                    Err(e) => {
                                        warn!("Failed to parse JSON payload for '{}': {} - Raw: {}",
                                              id, e, payload_str);

                                        // Send raw payload as fallback
                                        let fallback_event = json!({
                                            "id": id,
                                            "raw_payload": payload_str,
                                            "parse_error": e.to_string()
                                        });

                                        if let Err(e) = channel.send(fallback_event) {
                                            warn!("Failed to send fallback event to channel for '{}': {:?}", id, e);
                                        }
                                    }
                                }
                            },
                            Err(e) => {
                                error!("Failed to decode message payload as UTF-8 for '{}': {}", id, e);
                            }
                        }
                    },
                    // Handle cancellation
                    _ = cancellation_token.cancelled() => {
                        info!("Cancellation received for feeder '{}'", id);
                        break;
                    }
                }
            }
        }
    })
}

/// Process incoming SCADA message and format it for the frontend
fn process_scada_message(scada_output: &ScadaOutput, message: &Value) -> Value {
    let id = &scada_output.id;

    // Check if this is a TS/TM format message (has tase2 field)
    if let Some(tase2) = message.get("tase2") {
        // TS/TM format message
        let mut processed = json!({
            "id": id,
            "dynawo_id": &scada_output.dynawo_id,
            "tase2": tase2,
            "format": "TS_TM",
            "timestamp": message.get("ts").and_then(|v| v.as_u64()).unwrap_or(0),
            "cause": message.get("cause").and_then(|v| v.as_str()).unwrap_or("unknown"),
            "validity": message.get("validity").and_then(|v| v.as_str()).unwrap_or("unknown"),
            "operator_blocked": message.get("operatorBlocked").and_then(|v| v.as_bool()).unwrap_or(false)
        });

        // Handle different value types
        if let Some(value) = message.get("value") {
            // Télémesure (TM) - analog value
            processed["value"] = value.clone();
            processed["type"] = json!("TM");
        } else if let Some(st_val) = message.get("stVal") {
            // Télésignalisation (TS) - digital value
            processed["stVal"] = st_val.clone();
            processed["type"] = json!("TS");
        }

        // Add TFOS if present
        if let Some(tfos) = message.get("tfos") {
            processed["tfos"] = tfos.clone();
        }

        processed
    } else {
        // Legacy format message
        json!({
            "id": id,
            "dynawo_id": &scada_output.dynawo_id,
            "format": "Legacy",
            "value": message.get("value"),
            "time_sent": message.get("time_sent"),
            "time_received": message.get("time_received"),
            "raw_message": message
        })
    }
}

/// Utility function to create multiple feeders from a list of SCADA outputs
pub fn create_feeders_for_outputs(
    client: Arc<async_nats::Client>,
    channel: Channel<serde_json::Value>,
    scada_outputs: Vec<ScadaOutput>,
) -> Vec<CancellableTask<()>> {
    scada_outputs
        .into_iter()
        .map(|output| {
            create_task_feeder(
                client.clone(),
                channel.clone(),
                output,
            )
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_process_ts_tm_message() {
        let scada_output = ScadaOutput {
            id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
            dynawo_id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
            tase2: "M_3486_6_1_2".to_string(),
            source: "RTU_ICCP_REE".to_string(),
            destination: "SCADA".to_string(),
            topic: ".A.ZA".to_string(),
            graphical_id: "id_46_A_46_ZA6_46_ACAM_46_1_ARROW_REACTIVE".to_string(),
            publish_on_change: None,
        };

        let ts_tm_message = json!({
            "id": "NETWORK_.A.ZA6.ACAM.1_QRaw_value",
            "tase2": "M_3486_6_1_2",
            "cause": "1",
            "validity": "0",
            "operatorBlocked": false,
            "ts": 1692640800,
            "value": 15.75,
            "tfos": "111110011101111011100100"
        });

        let processed = process_scada_message(&scada_output, &ts_tm_message);

        assert_eq!(processed["format"], "TS_TM");
        assert_eq!(processed["type"], "TM");
        assert_eq!(processed["value"], 15.75);
        assert_eq!(processed["tase2"], "M_3486_6_1_2");
    }

    #[test]
    fn test_process_legacy_message() {
        let scada_output = ScadaOutput {
            id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
            dynawo_id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
            tase2: "M_3486_6_1_2".to_string(),
            source: "RTU_ICCP_REE".to_string(),
            destination: "SCADA".to_string(),
            topic: ".A.ZA".to_string(),
            graphical_id: "id_46_A_46_ZA6_46_ACAM_46_1_ARROW_REACTIVE".to_string(),
            publish_on_change: None,
        };

        let legacy_message = json!({
            "id": "NETWORK_.A.ZA6.ACAM.1_QRaw_value",
            "value": 15.75,
            "time_sent": 1692640800.123,
            "time_received": 1692640800.150
        });

        let processed = process_scada_message(&scada_output, &legacy_message);

        assert_eq!(processed["format"], "Legacy");
        assert_eq!(processed["value"], 15.75);
    }

    #[test]
    fn test_topic_sanitization() {
        // This would be tested in the actual task creation
        let topic = ".A.ZA";
        let sanitized = topic.replace(".", "_");
        assert_eq!(sanitized, "_A_ZA");

        let full_topic = format!("HMI.SCADA.{}", sanitized);
        assert_eq!(full_topic, "HMI.SCADA._A_ZA");
    }
}