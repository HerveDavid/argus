use errors::{PowsyblError, PowsyblResult};
use serde_json::{json, Value};
use uuid::Uuid;
use zeromq::{Socket, SocketRecv, SocketSend};

mod diagrams;
mod substations;
mod voltage_levels;

pub mod commands;
pub mod entities;
pub mod errors;
pub mod state;

// Helper function to send ZMQ request
async fn send_zmq_request(method: &str, params: Option<Value>) -> PowsyblResult<Value> {
    let mut socket = zeromq::ReqSocket::new();
    socket.connect("tcp://localhost:5555").await?;

    // Generate a unique request ID
    let request_id = Uuid::new_v4().to_string();
    let request = json!({
        "type": "request",
        "id": request_id,
        "method": method,
        "params": params.unwrap_or(json!({}))
    });

    // Send this request
    let request_str = serde_json::to_string(&request)?;
    socket.send(request_str.into()).await?;

    // Receice a response
    let response_msg = socket.recv().await?;
    let response_bytes = response_msg
        .get(0)
        .ok_or_else(|| PowsyblError::JsonParseError("Empty response".to_string()))?;
    let reponse_str = std::str::from_utf8(response_bytes)?;
    let response: Value = serde_json::from_str(&reponse_str)?;

    // Check status
    if let Some(status) = response.get("status").and_then(|s| s.as_i64()) {
        if status >= 400 {
            let error_msg = response
                .get("result")
                .and_then(|r| r.get("error"))
                .and_then(|e| e.as_str())
                .unwrap_or("Unknown error");
            return Err(PowsyblError::ApiError(error_msg.to_string()));
        }
    }

    // Return result
    if let Some(result) = response.get("result") {
        Ok(result.clone())
    } else {
        Err(PowsyblError::JsonParseError(
            "No result in response".to_string(),
        ))
    }
}
