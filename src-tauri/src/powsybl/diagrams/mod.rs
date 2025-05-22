use std::io::Read;

use crate::{database::DatabaseState, settings::get_setting};

use super::{entities::FetchStatus, send_zmq_request, PowsyblResult};

mod entities;
mod single_line;

pub mod errors;
pub mod sld_metadata;
pub mod sld_subscriptions;

use base64::Engine;
pub use single_line::{
    get_single_line_diagram, get_single_line_diagram_metadata,
    get_single_line_diagram_with_metadata,
};
pub use sld_subscriptions::{subscribe_single_line_diagram, unsubscribe_single_line_diagram};

use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn upload_iidm(state: State<'_, DatabaseState>) -> PowsyblResult<FetchStatus> {
    let state = state.lock().await;
    if let Some(config) = get_setting(&state.pool, "iidm").await.unwrap() {
        let path = config["iidm_path"].as_str().unwrap();
        let mut file = std::fs::File::open(path).unwrap();
        let mut file_data = Vec::new();
        file.read_to_end(&mut file_data).unwrap();

        let encoded = base64::engine::general_purpose::STANDARD.encode(&file_data);

        let params = serde_json::json!({
            "file_data": encoded,
            "filename": path
        });

        send_zmq_request("upload_iidm", Some(params)).await?;

        return Ok(FetchStatus {
            success: true,
            message: "".to_string(),
        });
    }

    Ok(FetchStatus {
        success: false,
        message: "".to_string(),
    })
}
