use super::sld_metadata::{FeederInfo, SldMetadata};
use crate::network::errors::NetworkResult;
use crate::state::AppState;

use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};


#[derive(Serialize, Deserialize)]
pub struct SldSubscriptionResponse {
    status: String,
}

#[derive(Clone, Serialize)]
#[serde(tag = "ti", content = "data")]
pub enum TeleInformation {
    TM { id: String, value: i32 },
}

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
    on_event: Channel<TeleInformation>,
) -> NetworkResult<SldSubscriptionResponse> {
    for active in sld_metadata.get_active_arrow_feeders() {
        on_event
            .send(TeleInformation::TM {
                id: active.id.clone(),
                value: 1234,
            })
            .unwrap();
    }

    Ok(SldSubscriptionResponse {
        status: "connected".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
) -> NetworkResult<SldSubscriptionResponse> {
    Ok(SldSubscriptionResponse {
        status: "connected".to_string(),
    })
}

impl SldMetadata {
    fn get_active_arrow_feeders(&self) -> Vec<FeederInfo> {
        self.feeder_infos
            .iter()
            .filter(|feeder| feeder.component_type == "ARROW_ACTIVE")
            .cloned()
            .collect()
    }
}
