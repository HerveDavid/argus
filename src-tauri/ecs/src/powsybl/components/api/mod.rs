use serde::{Deserialize, Serialize};

use super::Metadata;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SingleLineDiagramResponse {
    pub success: bool,
    #[serde(rename = "svg_content")]
    pub svg_content: String,
    pub metadata: Metadata,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(rename = "element_id")]
    pub element_id: String,
}
