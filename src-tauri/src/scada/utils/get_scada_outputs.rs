use crate::entities::sld_metadata::SldMetadata;
use crate::scada::entities::{QueryResponse, ScadaOutput, ScadaQuery};
use crate::scada::error::Error;
use crate::sessions::state::SessionState;

use super::super::error::Result;

pub async fn get_scada_outputs(
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

    log::debug!("Query response: success={}, data_count={}",
               response.success, response.data.len());

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
