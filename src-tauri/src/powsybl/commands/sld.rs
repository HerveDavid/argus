use crate::entities::sld_metadata::SldMetadata;
use crate::powsybl::error::{PowsyblError, PowsyblResult};
use crate::powsybl::send_zmq_request;
use crate::powsybl::state::PowsyblState;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::State;

/// Metadata and SVG result structure
#[derive(Serialize, Deserialize)]
pub struct DiagramResult {
    svg: String,
    metadata: SldMetadata,
}

/// Gets a single line diagram with metadata for a specific line ID using ZMQ
#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram_with_metadata(
    _state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    line_id: String,
) -> PowsyblResult<DiagramResult> {
    // Create params for ZMQ request
    let params = json!({
        "id": line_id,
        "format": "json"
    });

    log::debug!(
        "get_single_line_diagram_with_metadata called, with args: {}",
        &params
    );

    // Send ZMQ request to get diagram with metadata
    let result = send_zmq_request("get_single_line_diagram", Some(params.clone())).await?;

    // Parse response
    let svg = result
        .get("svg")
        .and_then(|v| v.as_str())
        .ok_or_else(|| PowsyblError::JsonParseError("Missing 'svg' field".to_string()))?
        .to_string();

    let metadata_value = result
        .get("metadata")
        .ok_or_else(|| PowsyblError::JsonParseError("Missing 'metadata' field".to_string()))?;

    let metadata: SldMetadata = serde_json::from_value(metadata_value.clone())
        .map_err(|e| PowsyblError::JsonParseError(e.to_string()))?;

    log::debug!("get_single_line_diagram_with_metadata succeed, with args: {}", &params);

    Ok(DiagramResult { svg, metadata })
}

/// Gets only the SVG diagram for a specific line ID using ZMQ
#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram(
    _state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    line_id: String,
) -> PowsyblResult<Vec<u8>> {
    // Create params for ZMQ request
    let params = json!({
        "id": line_id,
        "format": "svg"
    });

    // Send ZMQ request to get diagram SVG
    let result = send_zmq_request("get_single_line_diagram", Some(params)).await?;

    // Extract SVG content
    let svg = if let Some(content_type) = result.get("content_type") {
        if content_type == "image/svg+xml" {
            // SVG content is returned directly
            result
                .get("svg")
                .and_then(|v| v.as_str())
                .ok_or_else(|| PowsyblError::JsonParseError("Missing 'svg' field".to_string()))?
        } else {
            return Err(PowsyblError::JsonParseError(
                "Unexpected content type".to_string(),
            ));
        }
    } else {
        return Err(PowsyblError::JsonParseError(
            "Missing content type".to_string(),
        ));
    };

    Ok(svg.as_bytes().to_vec())
}

/// Gets only the diagram metadata for a specific line ID using ZMQ
#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram_metadata(
    _state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    line_id: String,
) -> PowsyblResult<SldMetadata> {
    // Create params for ZMQ request
    let params = json!({
        "id": line_id
    });

    // Send ZMQ request to get diagram metadata
    let result = send_zmq_request("get_single_line_diagram_metadata", Some(params)).await?;

    // Parse metadata
    let metadata: SldMetadata =
        serde_json::from_value(result).map_err(|e| PowsyblError::JsonParseError(e.to_string()))?;

    Ok(metadata)
}
