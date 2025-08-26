use crate::game_master::entities::{
    FallbackMessage, LegacyMessage, ScadaMessage, ScadaOutput, TsTmMessage,
};
use crate::utils::tasks::CancellableTask;

use futures::StreamExt;
use log::{debug, error, info, warn};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::ipc::Channel;

pub fn create_task_feeder(
    client: Arc<async_nats::Client>,
    channel: Channel<ScadaMessage>,
    scada_output: ScadaOutput,
    paused: Arc<AtomicBool>,
) -> CancellableTask<()> {
    todo!()
    // // Create cancellable task for this NATS subscription
    // CancellableTask::new({
    //     let id = scada_output.id.clone();
    //     let destination = scada_output.destination.clone();
    //     let local_topic = scada_output.topic.clone();

    //     // Sanitize the local topic (replace dots with underscores)
    //     let sanitized_topic = local_topic.replace(".", "_");

    //     // Create full topic: HMI.<destination>.<sanitized_topic>
    //     let full_topic = format!("HMI.{}.{}", destination, sanitized_topic);

    //     move |cancellation_token| async move {
    //         // Subscribe to the topic
    //         let mut subscription = match client.subscribe(full_topic.clone()).await {
    //             Ok(sub) => sub,
    //             Err(e) => {
    //                 error!("Failed to subscribe to topic '{}': {}", full_topic, e);
    //                 return;
    //             }
    //         };

    //         info!(
    //             "Successfully subscribed to topic '{}' for SCADA output '{}' (dynawo_id: {})",
    //             full_topic, id, scada_output.dynawo_id
    //         );

    //         // Main message processing loop
    //         loop {
    //             tokio::select! {
    //                 // Handle incoming messages
    //                 Some(msg) = subscription.next() => {
    //                     if paused.load(Ordering::Relaxed) {
    //                         debug!("Feeder '{}' is paused, skipping message", id);
    //                         continue;
    //                     }

    //                     // Parse the message payload
    //                     match std::str::from_utf8(&msg.payload) {
    //                         Ok(payload_str) => {
    //                             debug!("Feeder '{}' received raw payload: {}", id, payload_str);

    //                             // Try to parse as JSON
    //                             match serde_json::from_str::<serde_json::Value>(payload_str) {
    //                                 Ok(parsed_json) => {
    //                                     // Process TS/TM format or Legacy format
    //                                     let processed_message = process_scada_message(
    //                                         &scada_output,
    //                                         &parsed_json
    //                                     );

    //                                     debug!("Processed message for '{}': {:?}", id, processed_message);

    //                                     if let Err(e) = channel.send(processed_message) {
    //                                         warn!("Failed to send message to channel for '{}': {:?}", id, e);
    //                                     }
    //                                 },
    //                                 Err(e) => {
    //                                     warn!("Failed to parse JSON payload for '{}': {} - Raw: {}",
    //                                           id, e, payload_str);

    //                                     // Send fallback message
    //                                     let fallback_message = ScadaMessage::Fallback(FallbackMessage {
    //                                         id: id.clone(),
    //                                         raw_payload: payload_str.to_string(),
    //                                         parse_error: e.to_string(),
    //                                     });

    //                                     if let Err(e) = channel.send(fallback_message) {
    //                                         warn!("Failed to send fallback message to channel for '{}': {:?}", id, e);
    //                                     }
    //                                 }
    //                             }
    //                         },
    //                         Err(e) => {
    //                             error!("Failed to decode message payload as UTF-8 for '{}': {}", id, e);
    //                         }
    //                     }
    //                 },
    //                 // Handle cancellation
    //                 _ = cancellation_token.cancelled() => {
    //                     info!("Cancellation received for feeder '{}'", id);
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    // })
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

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use serde_json::json;

//     #[test]
//     fn test_process_ts_tm_telemesure_message() {
//         let scada_output = ScadaOutput {
//             id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
//             dynawo_id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
//             tase2: "M_3486_6_1_2".to_string(),
//             source: "RTU_ICCP_REE".to_string(),
//             destination: "SCADA".to_string(),
//             topic: ".A.ZA".to_string(),
//             graphical_id: "id_46_A_46_ZA6_46_ACAM_46_1_ARROW_REACTIVE".to_string(),
//             publish_on_change: None,
//         };

//         let ts_tm_message = json!({
//             "id": "NETWORK_.A.ZA6.ACAM.1_QRaw_value",
//             "tase2": "M_3486_6_1_2",
//             "cause": "1",
//             "validity": "0",
//             "operatorBlocked": false,
//             "ts": 1692640800,
//             "value": 15.75,
//             "tfos": "111110011101111011100100"
//         });

//         let processed = process_scada_message(&scada_output, &ts_tm_message);

//         match processed {
//             ScadaMessage::TsTm(msg) => {
//                 assert_eq!(msg.format, "TS_TM");
//                 assert_eq!(msg.tase2, "M_3486_6_1_2");
//                 assert_eq!(msg.timestamp, 1692640800);
//                 assert_eq!(msg.message_type, "TM");
//                 assert_eq!(msg.value, Some(15.75));
//                 assert_eq!(msg.st_val, None);
//                 assert_eq!(msg.tfos, Some("111110011101111011100100".to_string()));
//             }
//             _ => panic!("Expected TsTm message"),
//         }
//     }

//     #[test]
//     fn test_process_ts_tm_telesignalisation_message() {
//         let scada_output = ScadaOutput {
//             id: "NETWORK_.A.ZA6.ACAM.1_Status".to_string(),
//             dynawo_id: "NETWORK_.A.ZA6.ACAM.1_Status".to_string(),
//             tase2: "M_3486_6_1_3".to_string(),
//             source: "RTU_ICCP_REE".to_string(),
//             destination: "SCADA".to_string(),
//             topic: ".A.ZA".to_string(),
//             graphical_id: "id_46_A_46_ZA6_46_ACAM_46_1_STATUS".to_string(),
//             publish_on_change: None,
//         };

//         let ts_message = json!({
//             "id": "NETWORK_.A.ZA6.ACAM.1_Status",
//             "tase2": "M_3486_6_1_3",
//             "cause": "1",
//             "validity": "0",
//             "operatorBlocked": false,
//             "ts": 1692640800,
//             "stVal": true
//         });

//         let processed = process_scada_message(&scada_output, &ts_message);

//         match processed {
//             ScadaMessage::TsTm(msg) => {
//                 assert_eq!(msg.format, "TS_TM");
//                 assert_eq!(msg.message_type, "TS");
//                 assert_eq!(msg.value, None);
//                 assert_eq!(msg.st_val, Some(json!(true)));
//             }
//             _ => panic!("Expected TsTm message"),
//         }
//     }

//     #[test]
//     fn test_process_legacy_message() {
//         let scada_output = ScadaOutput {
//             id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
//             dynawo_id: "NETWORK_.A.ZA6.ACAM.1_QRaw_value".to_string(),
//             tase2: "M_3486_6_1_2".to_string(),
//             source: "RTU_ICCP_REE".to_string(),
//             destination: "SCADA".to_string(),
//             topic: ".A.ZA".to_string(),
//             graphical_id: "id_46_A_46_ZA6_46_ACAM_46_1_ARROW_REACTIVE".to_string(),
//             publish_on_change: None,
//         };

//         let legacy_message = json!({
//             "id": "NETWORK_.A.ZA6.ACAM.1_QRaw_value",
//             "value": 15.75,
//             "time_sent": 1692640800.123,
//             "time_received": 1692640800.150
//         });

//         let processed = process_scada_message(&scada_output, &legacy_message);

//         match processed {
//             ScadaMessage::Legacy(msg) => {
//                 assert_eq!(msg.format, "Legacy");
//                 assert_eq!(msg.value, Some(json!(15.75)));
//                 assert_eq!(msg.time_sent, Some(1692640800.123));
//                 assert_eq!(msg.time_received, Some(1692640800.150));
//             }
//             _ => panic!("Expected Legacy message"),
//         }
//     }

//     #[test]
//     fn test_topic_sanitization() {
//         let topic = ".A.ZA";
//         let sanitized = topic.replace(".", "_");
//         assert_eq!(sanitized, "_A_ZA");

//         let full_topic = format!("HMI.SCADA.{}", sanitized);
//         assert_eq!(full_topic, "HMI.SCADA._A_ZA");
//     }

//     #[test]
//     fn test_serialization() {
//         let ts_message = ScadaMessage::TsTm(TsTmMessage {
//             id: "test".to_string(),
//             dynawo_id: "test_dynawo".to_string(),
//             graphical_id: "graphical_id".to_string(),
//             format: "TS_TM".to_string(),
//             tase2: "M_123".to_string(),
//             timestamp: 1692640800,
//             cause: "1".to_string(),
//             validity: "0".to_string(),
//             operator_blocked: false,
//             message_type: "TM".to_string(),
//             value: Some(15.75),
//             st_val: None,
//             tfos: None,
//         });

//         // Test serialization
//         let json_str = serde_json::to_string(&ts_message).unwrap();
//         assert!(json_str.contains("TS_TM"));
//         assert!(json_str.contains("TM"));

//         // Test deserialization
//         let deserialized: ScadaMessage = serde_json::from_str(&json_str).unwrap();
//         match deserialized {
//             ScadaMessage::TsTm(msg) => {
//                 assert_eq!(msg.id, "test");
//                 assert_eq!(msg.format, "TS_TM");
//                 assert_eq!(msg.message_type, "TM");
//                 assert_eq!(msg.value, Some(15.75));
//             }
//             _ => panic!("Expected TsTm message"),
//         }
//     }
// }
