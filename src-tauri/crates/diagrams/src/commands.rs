use crate::entities::{SldMetadata, SldResponse};
use crate::errors::Result;
use crate::state::SldState;

#[tauri::command]
pub async fn subscribe_diagram(state: &mut SldState, metadata: SldMetadata) -> Result<SldResponse> {
    todo!()
}

#[tauri::command]
pub async fn unsubscribe_diagram(
    state: &mut SldState,
    metadata: SldMetadata,
) -> Result<SldResponse> {
    todo!()
}

#[tauri::command]
pub async fn update_feeders() -> Result<SldResponse> {
    todo!()
}

#[tauri::command]
pub async fn update_events() -> Result<SldResponse> {
    todo!()
}
