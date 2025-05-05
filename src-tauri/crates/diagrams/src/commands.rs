use tauri::{AppHandle, Manager};

use crate::entities::{SldMetadata, SldResponse};
use crate::errors::Result;
use crate::state::SldState;

#[tauri::command]
pub async fn subscribe_diagram(
    app_handle: &AppHandle,
    metadata: SldMetadata,
) -> Result<SldResponse> {
    let state = app_handle.state::<SldState>();
    todo!()
}

#[tauri::command]
pub async fn unsubscribe_diagram(
    app_handle: &AppHandle,
    metadata: SldMetadata,
) -> Result<SldResponse> {
    todo!()
}

#[tauri::command]
pub async fn update_feeders(app_handle: &AppHandle, metadata: SldMetadata) -> Result<SldResponse> {
    todo!()
}

#[tauri::command]
pub async fn update_events(app_handle: &AppHandle, metadata: SldMetadata) -> Result<SldResponse> {
    todo!()
}
