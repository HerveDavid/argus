use crate::entities::sld_metadata::SldMetadata;
use crate::scada::entities::{QueryResponse, ScadaOutput, ScadaQuery};
use crate::scada::error::Error;
use crate::sessions::state::SessionState;

use super::super::error::Result;

use async_nats::Message;
use futures::{Stream, StreamExt};
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

async fn get_stream_topic(output: ScadaOutput, client: &Arc<async_nats::Client>) -> StreamTopic {
    let topic = get_topic(&output);
    let subscription = client.subscribe(topic.clone()).await.unwrap();
    let output = Arc::new(output);
    subscription
        .map(move |msg| (topic.clone(), output.clone(), msg))
        .boxed()
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

    // Avec la structure actuelle Vec<Vec<String>>, on passe bien vec![feeder_ids]
    let query_body = ScadaQuery {
        query: "SELECT * FROM scada_outputs WHERE graphical_id = ANY(SELECT unnest(?))".to_string(),
        parameters: vec![feeder_ids], // Correct pour Vec<Vec<String>>
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
    let mut streams = Vec::new();

    for output in outputs {
        let stream = get_stream_topic(output, &client).await;
        streams.push(stream);
    }

    Ok(streams)
}
