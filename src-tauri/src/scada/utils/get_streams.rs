use crate::entities::sld_metadata::SldMetadata;
use crate::scada::entities::{QueryResponse, ScadaOutput, ScadaQuery};
use crate::scada::error::Error;
use crate::sessions::state::SessionState;

use super::super::error::Result;

use async_nats::Message;
use futures::{Stream, StreamExt};
use std::collections::HashMap;
use std::pin::Pin;
use std::sync::Arc;

pub type StreamTopic = Pin<Box<dyn Stream<Item = (String, Arc<ScadaOutput>, Message)> + Send>>;

fn get_topic(output: &ScadaOutput) -> String {
    let destination = output.destination.clone();
    let local_topic = output.topic.clone();

    // Sanitize the local topic (replace dots with underscores)
    let sanitized_topic = local_topic.replace(".", "_");

    // Create full topic: HMI.<destination>.<sanitized_topic>
    format!("HMI.{}.{}", destination, sanitized_topic)
}

// ✅ Fonction pour résoudre le bon output depuis le message NATS
fn resolve_output_from_message(
    msg: &Message,
    id_to_output: &HashMap<String, Arc<ScadaOutput>>,
) -> Option<Arc<ScadaOutput>> {
    // Parser le JSON pour extraire l'ID
    if let Ok(payload_str) = std::str::from_utf8(&msg.payload) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(payload_str) {
            if let Some(message_id) = json.get("id").and_then(|v| v.as_str()) {
                // Essayer de matcher avec les clés disponibles
                return id_to_output.get(message_id).cloned();
            }
        }
    }
    None
}

async fn get_scada_outputs(
    session_client: tokio::sync::MutexGuard<'_, SessionState>,
    metadata: SldMetadata,
) -> Result<Vec<ScadaOutput>> {
    let feeder_ids: Vec<String> = metadata
        .feeder_infos
        .iter()
        .map(|feeder| feeder.id.clone())
        .collect();

    log::debug!("Feeder IDs extracted: {:?}", feeder_ids);

    if feeder_ids.is_empty() {
        log::warn!("No feeder IDs found in metadata");
        return Ok(vec![]);
    }

    let query_body = ScadaQuery {
        query: "SELECT * FROM scada_outputs WHERE graphical_id = ANY(SELECT unnest(?))".to_string(),
        parameters: vec![feeder_ids],
    };

    log::debug!("Executing query: {:?}", query_body);

    let response: QueryResponse = session_client.post("powsybl/query", &query_body).await?;

    log::debug!(
        "Query response: success={}, data_count={}",
        response.success,
        response.data.len()
    );

    if !response.success {
        let error_msg = response.error.unwrap_or_else(|| "Query failed".to_string());
        log::error!("Query failed: {}", error_msg);
        return Err(Error::HttpError {
            status: 500,
            message: error_msg,
        });
    }

    if response.data.is_empty() {
        log::warn!("Query succeeded but returned no data");
    }

    Ok(response.data)
}

pub async fn get_streams(
    client: Arc<async_nats::Client>,
    session_client: tokio::sync::MutexGuard<'_, SessionState>,
    metadata: SldMetadata,
) -> Result<Vec<StreamTopic>> {
    let outputs = get_scada_outputs(session_client, metadata).await?;

    // ✅ Grouper les outputs par topic pour éviter les subscriptions multiples
    let mut topic_to_outputs: HashMap<String, Vec<ScadaOutput>> = HashMap::new();

    for output in outputs {
        let topic = get_topic(&output);
        topic_to_outputs
            .entry(topic)
            .or_insert_with(Vec::new)
            .push(output);
    }

    log::debug!(
        "Unique topics found: {:?}",
        topic_to_outputs.keys().collect::<Vec<_>>()
    );

    let mut streams = Vec::new();

    for (topic, outputs) in topic_to_outputs {
        log::debug!(
            "Creating subscription for topic '{}' with {} outputs",
            topic,
            outputs.len()
        );

        // ✅ Créer un mapping ID du message -> ScadaOutput pour ce topic
        let mut id_to_output: HashMap<String, Arc<ScadaOutput>> = HashMap::new();

        for output in outputs {
            // 🔧 AJUSTEZ ICI : quel champ de ScadaOutput correspond à l'ID du message JSON ?
            // Option 1: Si dynawo_id correspond à l'ID du message
            id_to_output.insert(output.dynawo_id.clone(), Arc::new(output.clone()));

            // Option 2: Si c'est l'ID de l'output lui-même
            // id_to_output.insert(output.id.clone(), Arc::new(output.clone()));

            // Option 3: Si vous avez un autre champ
            // id_to_output.insert(output.some_field.clone(), Arc::new(output.clone()));

            log::debug!(
                "Mapped message ID '{}' -> output ID '{}'",
                output.dynawo_id,
                output.id
            );
        }

        // ✅ Une seule subscription par topic
        let subscription = client
            .subscribe(topic.clone())
            .await
            .map_err(|e| Error::HttpError {
                status: 500,
                message: format!("Failed to subscribe to topic {}: {}", topic, e),
            })?;

        let stream = subscription
            .filter_map(move |msg| {
                let id_to_output = id_to_output.clone();
                let topic = topic.clone();

                async move {
                    // ✅ Résoudre le bon output basé sur l'ID du message
                    match resolve_output_from_message(&msg, &id_to_output) {
                        Some(output) => {
                            log::trace!("Resolved message to output ID: {}", output.id);
                            Some((topic, output, msg))
                        }
                        None => {
                            // ⚠️ Aucun output trouvé pour ce message
                            if let Ok(payload_str) = std::str::from_utf8(&msg.payload) {
                                if let Ok(json) =
                                    serde_json::from_str::<serde_json::Value>(payload_str)
                                {
                                    if let Some(message_id) =
                                        json.get("id").and_then(|v| v.as_str())
                                    {
                                        log::warn!(
                                            "No output found for message ID '{}' on topic '{}'",
                                            message_id,
                                            topic
                                        );
                                        log::debug!(
                                            "Available output IDs: {:?}",
                                            id_to_output.keys().collect::<Vec<_>>()
                                        );
                                    }
                                }
                            }
                            None
                        }
                    }
                }
            })
            .boxed();

        streams.push(stream);
    }

    log::debug!("Created {} unique topic streams", streams.len());
    Ok(streams)
}
