use super::sld_metadata::SldMetadata;
use crate::network::errors::NetworkResult;
use crate::state::AppState;

use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize)]
pub enum SldSubscriptionStatus {
    Connected,
    Unconnected,
}

#[derive(Serialize, Deserialize)]
pub struct SldSubscriptionResponse {
    status: SldSubscriptionStatus,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
) -> NetworkResult<SldSubscriptionResponse> {
    Ok(SldSubscriptionResponse {
        status: SldSubscriptionStatus::Connected,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
) -> NetworkResult<SldSubscriptionResponse> {
    Ok(SldSubscriptionResponse {
        status: SldSubscriptionStatus::Connected,
    })
}
