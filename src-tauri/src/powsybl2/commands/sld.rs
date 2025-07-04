use crate::entities::sld_metadata::SldMetadata;
use crate::powsybl::error::{PowsyblError, PowsyblResult};
use crate::powsybl::state::PowsyblState;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;
use tauri::State;
use uuid::Uuid;

/// Metadata and SVG result structure
#[derive(Serialize, Deserialize)]
pub struct DiagramResult {
    svg: String,
    metadata: SldMetadata,
}

/// Gets a single line diagram with metadata for a specific line ID using ZMQ via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram_with_metadata(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
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
    
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Envoyer la requête via le PowsyblState avec un timeout de 30 secondes
    let result = powsybl_state
        .send_request(
            "get_single_line_diagram", 
            Some(params.clone()), 
            Duration::from_secs(30)
        )
        .await?;
    
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
    
    log::debug!(
        "get_single_line_diagram_with_metadata succeed, with args: {}", 
        &params
    );
    
    Ok(DiagramResult { svg, metadata })
}

/// Gets only the SVG diagram for a specific line ID using ZMQ via PowsyblState
// #[tauri::command(rename_all = "snake_case")]
// pub async fn get_single_line_diagram(
//     state: State<'_, tokio::sync::Mutex<PowsyblState>>,
//     line_id: String,
// ) -> PowsyblResult<Vec<u8>> {
//     // Create params for ZMQ request
//     let params = json!({
//         "id": line_id,
//         "format": "svg"
//     });
    
//     // Acquérir le verrou sur le state
//     let mut powsybl_state = state.lock().await;
    
//     // Send ZMQ request to get diagram SVG
//     let result = powsybl_state
//         .send_request(
//             "get_single_line_diagram", 
//             Some(params), 
//             Duration::from_secs(30)
//         )
//         .await?;
    
//     // Extract SVG content
//     let svg = if let Some(content_type) = result.get("content_type") {
//         if content_type == "image/svg+xml" {
//             // SVG content is returned directly
//             result
//                 .get("svg")
//                 .and_then(|v| v.as_str())
//                 .ok_or_else(|| PowsyblError::JsonParseError("Missing 'svg' field".to_string()))?
//         } else {
//             return Err(PowsyblError::JsonParseError(
//                 "Unexpected content type".to_string(),
//             ));
//         }
//     } else {
//         return Err(PowsyblError::JsonParseError(
//             "Missing content type".to_string(),
//         ));
//     };
    
//     Ok(svg.as_bytes().to_vec())
// }

/// Gets only the diagram metadata for a specific line ID using ZMQ via PowsyblState
#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram_metadata(
    state: State<'_, tokio::sync::Mutex<PowsyblState>>,
    line_id: String,
) -> PowsyblResult<SldMetadata> {
    // Create params for ZMQ request
    let params = json!({
        "id": line_id
    });
    
    // Acquérir le verrou sur le state
    let mut powsybl_state = state.lock().await;
    
    // Send ZMQ request to get diagram metadata
    let result = powsybl_state
        .send_request(
            "get_single_line_diagram_metadata", 
            Some(params), 
            Duration::from_secs(30)
        )
        .await?;
    
    // Parse metadata
    let metadata: SldMetadata =
        serde_json::from_value(result).map_err(|e| PowsyblError::JsonParseError(e.to_string()))?;
    
    Ok(metadata)
}