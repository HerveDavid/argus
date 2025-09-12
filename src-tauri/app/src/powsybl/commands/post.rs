use tauri::State;

use crate::sessions::state::SessionState;

use super::super::entities::*;
use super::super::error::Result;



#[tauri::command(rename_all = "snake_case")]
pub async fn execute_query(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    query: String,
    parameters: Option<Vec<serde_json::Value>>,
    limit: Option<i32>,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let request_body = SQLQueryRequest {
        query,
        parameters,
        limit,
    };

    let response = session.post::<QueryResponse, SQLQueryRequest>("powsybl/query", &request_body).await?;
    Ok(response)
}