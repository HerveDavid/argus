use super::error::{Error, Result};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex as TokioMutex;
use tokio::task::JoinHandle;
use tokio::time::timeout;
use uuid::Uuid;
use zeromq::{Socket, SocketRecv, SocketSend, ZmqMessage};

const BROKER_PUB_ENDPOINT: &str = "tcp://localhost:10242";
const BROKER_SUB_ENDPOINT: &str = "tcp://localhost:10241";
const POWSYBL_REQUEST_TOPIC: &str = "powsybl.request";
const POWSYBL_RESPONSE_TOPIC: &str = "powsybl.response";

pub struct DatabaseManager {
    pub_socket: zeromq::PubSocket,
    sub_socket: Arc<TokioMutex<zeromq::SubSocket>>,
    pending_requests: Arc<TokioMutex<HashMap<String, tokio::sync::oneshot::Sender<Value>>>>,
    _listening_task: Option<JoinHandle<()>>,
}

impl DatabaseManager {
    pub async fn new() -> Result<Self> {
        // ZMQ sockets
        let mut pub_socket = zeromq::PubSocket::new();
        let mut sub_socket = zeromq::SubSocket::new();
        let pending_requests = Arc::new(TokioMutex::new(HashMap::default()));

        pub_socket.connect(BROKER_PUB_ENDPOINT).await?;
        sub_socket.connect(BROKER_SUB_ENDPOINT).await?;
        sub_socket.subscribe(POWSYBL_RESPONSE_TOPIC).await?;

        // Wait connection
        tokio::time::sleep(Duration::from_millis(100)).await;

        let sub_socket = Arc::new(TokioMutex::new(sub_socket));
        let mut state = Self {
            pub_socket,
            sub_socket: sub_socket.clone(),
            pending_requests: pending_requests.clone(),
            _listening_task: None,
        };

        // Start listening
        let listening_task = Self::start_listening_task(sub_socket, pending_requests).await;
        state._listening_task = Some(listening_task);

        Ok(state)
    }

    async fn start_listening_task(
        sub_socket: Arc<TokioMutex<zeromq::SubSocket>>,
        pending_requests: Arc<TokioMutex<HashMap<String, tokio::sync::oneshot::Sender<Value>>>>,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            loop {
                let message_result = {
                    let mut socket = sub_socket.lock().await;
                    socket.recv().await
                };

                match message_result {
                    Ok(message) => {
                        if let Ok((request_id, response)) =
                            Self::parse_response_message(message).await
                        {
                            let mut pending = pending_requests.lock().await;
                            if let Some(sender) = pending.remove(&request_id) {
                                if let Err(_) = sender.send(response) {
                                    log::error!("Sending error for ID: {}", request_id);
                                }
                            } else {
                                log::warn!("No request for ID: {}", request_id);
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Received error: {}", e);
                        tokio::time::sleep(Duration::from_millis(100)).await;
                    }
                }
            }
        })
    }

    async fn parse_response_message(message: ZmqMessage) -> Result<(String, Value)> {
        let message_bytes = message
            .get(0)
            .ok_or_else(|| Error::JsonParseError("Empty message".to_string()))?;

        let message_str = std::str::from_utf8(message_bytes)
            .map_err(|e| Error::JsonParseError(format!("Error UTF-8: {}", e)))?;

        if let Some(space_pos) = message_str.find(' ') {
            let topic = &message_str[..space_pos];
            let json_payload = &message_str[space_pos + 1..];

            if topic == POWSYBL_RESPONSE_TOPIC {
                let response: Value = serde_json::from_str(json_payload)
                    .map_err(|e| Error::JsonParseError(format!("Error JSON: {}", e)))?;

                // Extraire l'ID de la requête
                if let Some(request_id) = response.get("id").and_then(|id| id.as_str()) {
                    log::debug!("Receive response for ID: {}", request_id);
                    return Ok((request_id.to_string(), response));
                }
            }
        }

        Err(Error::JsonParseError(
            "Format de réponse invalide".to_string(),
        ))
    }

    pub async fn send_request(
        &mut self,
        method: &str,
        params: Option<Value>,
        timeout_duration: Duration,
    ) -> Result<Value> {
        let request_id = Uuid::new_v4().to_string();

        let request = json!({
            "id": request_id,
            "method": method,
            "params": params.unwrap_or(json!({}))
        });

        let (tx, rx) = tokio::sync::oneshot::channel();

        {
            let mut pending = self.pending_requests.lock().await;
            pending.insert(request_id.clone(), tx);
        }

        let message = format!(
            "{} {}",
            POWSYBL_REQUEST_TOPIC,
            serde_json::to_string(&request)?
        );
        self.pub_socket.send(message.into()).await?;

        log::debug!("Requête envoyée: {} (ID: {})", method, request_id);

        // Wait with timeout
        match timeout(timeout_duration, rx).await {
            Ok(Ok(response)) => {
                if let Some(error) = response.get("error") {
                    let error_msg = error.as_str().unwrap_or("Erreur inconnue");
                    log::error!("Erreur dans la réponse: {}", error_msg);
                    return Err(Error::ApiError(error_msg.to_string()));
                }

                if let Some(status) = response.get("status").and_then(|s| s.as_i64()) {
                    if status >= 400 {
                        let error_msg = response
                            .get("result")
                            .and_then(|r| r.get("error"))
                            .and_then(|e| e.as_str())
                            .unwrap_or("Erreur inconnue");
                        return Err(Error::ApiError(error_msg.to_string()));
                    }
                }

                if let Some(result) = response.get("result") {
                    Ok(result.clone())
                } else {
                    Err(Error::JsonParseError(
                        "Pas de résultat dans la réponse".to_string(),
                    ))
                }
            }
            Ok(Err(_)) => Err(Error::JsonParseError(
                "Erreur du channel de réponse".to_string(),
            )),
            Err(_) => {
                let mut pending = self.pending_requests.lock().await;
                pending.remove(&request_id);
                Err(Error::ApiError(format!(
                    "Timeout pour la requête {} (ID: {})",
                    method, request_id
                )))
            }
        }
    }
}

impl Drop for DatabaseManager {
    fn drop(&mut self) {
        if let Some(task) = &self._listening_task {
            task.abort();
        }
    }
}
