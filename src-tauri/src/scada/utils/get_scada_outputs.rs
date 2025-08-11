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

    let query_body = ScadaQuery {
                query: "SELECT * FROM scada_outputs WHERE graphical_id = ANY(SELECT unnest(?))"
                    .to_string(),
                parameters: vec![feeder_ids],
            };

    let response: QueryResponse = session_client.post("powsybl/query", &query_body).await?;

    if !response.success {
        return Err(Error::HttpError {
            status: 500,
            message: response.error.unwrap_or_else(|| "Query failed".to_string()),
        });
    }

    Ok(response.data)
}