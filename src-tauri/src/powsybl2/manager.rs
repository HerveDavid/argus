use crate::powsybl::error::{PowsyblError, PowsyblResult};

use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Mutex, oneshot};
use uuid::Uuid;
use zeromq::{PubSocket, Socket, SocketRecv, SocketSend, SubSocket};

// Configuration des ports du broker
const BROKER_PUB_PORT: u16 = 10241; // Port PUB du broker (on s'y connecte en SUB)
const BROKER_SUB_PORT: u16 = 10242; // Port SUB du broker (on s'y connecte en PUB)

pub struct BrokerManager {
    pub_socket: PubSocket,
    sub_socket: SubSocket,
    pending_requests: Arc<Mutex<HashMap<String, oneshot::Sender<Value>>>>,
}


impl BrokerManager {
    pub async fn new() -> PowsyblResult<Self> {
        let mut pub_socket = PubSocket::new();
        let mut sub_socket = SubSocket::new();

        // Se connecter au broker (pas bind, mais connect)
        pub_socket
            .connect(&format!("tcp://localhost:{}", BROKER_SUB_PORT))
            .await
            .map_err(|e| PowsyblError::ZmqError2(format!("Failed to connect PUB socket: {}", e)))?;

        sub_socket
            .connect(&format!("tcp://localhost:{}", BROKER_PUB_PORT))
            .await
            .map_err(|e| PowsyblError::ZmqError2(format!("Failed to connect SUB socket: {}", e)))?;

        // S'abonner aux réponses destinées à ce client
        sub_socket
            .subscribe("response.")
            .await
            .map_err(|e| PowsyblError::ZmqError2(format!("Failed to subscribe: {}", e)))?;

        println!("ZMQ Client connected to broker successfully");
        println!("  - Publishing to: tcp://localhost:{}", BROKER_SUB_PORT);
        println!("  - Subscribing from: tcp://localhost:{}", BROKER_PUB_PORT);

        Ok(Self {
            pub_socket,
            sub_socket,
            pending_requests: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    // Méthode pour démarrer l'écoute des réponses
    pub async fn start_response_listener(&mut self) -> PowsyblResult<()> {
        let pending_requests = Arc::clone(&self.pending_requests);
        
        println!("Starting response listener...");
        
        loop {
            match self.sub_socket.recv().await {
                Ok(message) => {
                    if let Some(msg_bytes) = message.get(0) {
                        if let Ok(msg_str) = std::str::from_utf8(msg_bytes) {
                            self.handle_response(msg_str, &pending_requests).await;
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error receiving response: {}", e);
                }
            }
        }
    }

    async fn handle_response(
        &self,
        message: &str,
        pending_requests: &Arc<Mutex<HashMap<String, oneshot::Sender<Value>>>>,
    ) {
        // Parse le message: "topic content"
        if let Some((topic, content)) = message.split_once(' ') {
            if topic.starts_with("response.") {
                // Extraire l'ID de la requête du topic
                if let Some(request_id) = topic.strip_prefix("response.") {
                    if let Ok(response_data) = serde_json::from_str::<Value>(content) {
                        println!("Received response for request {}: {}", request_id, response_data);
                        
                        let mut requests = pending_requests.lock().await;
                        if let Some(sender) = requests.remove(request_id) {
                            let _ = sender.send(response_data);
                        }
                    }
                }
            }
        }
    }

    // Méthode pour envoyer une requête avec attente de réponse
    pub async fn send_request(&mut self, method: &str, params: Option<Value>) -> PowsyblResult<Value> {
        // Générer un ID unique pour la requête
        let request_id = Uuid::new_v4().to_string();
        
        // Créer un canal pour recevoir la réponse
        let (response_sender, response_receiver) = oneshot::channel();
        
        // Ajouter la requête en attente
        {
            let mut pending = self.pending_requests.lock().await;
            pending.insert(request_id.clone(), response_sender);
        }

        // Construire la requête
        let request = json!({
            "type": "request",
            "id": request_id,
            "method": method,
            "params": params.unwrap_or(json!({}))
        });

        // Envoyer la requête avec le topic approprié
        let topic = "powsybl"; // Topic que le client Python écoute
        let message = format!("{} {}", topic, serde_json::to_string(&request)?);
        
        println!("Sending request: {}", message);
        
        self.pub_socket
            .send(message.into())
            .await
            .map_err(|e| PowsyblError::ZmqError2(e.to_string()))?;

        // Attendre la réponse avec timeout
        let response = tokio::time::timeout(
            Duration::from_secs(30),
            response_receiver
        ).await
        .map_err(|_| PowsyblError::TimeoutError("Request timeout".to_string()))?
        .map_err(|_| PowsyblError::InternalError("Response channel closed".to_string()))?;

        // Vérifier le statut de la réponse
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

        // Retourner le résultat
        if let Some(result) = response.get("result") {
            Ok(result.clone())
        } else {
            Err(PowsyblError::JsonParseError(
                "No result in response".to_string(),
            ))
        }
    }

    // Méthode pour publier un message simple (sans attente de réponse)
    pub async fn publish_message(&mut self, topic: &str, message: &Value) -> PowsyblResult<()> {
        let full_message = format!("{} {}", topic, serde_json::to_string(message)?);
        
        self.pub_socket
            .send(full_message.into())
            .await
            .map_err(|e| PowsyblError::ZmqError2(e.to_string()))?;
        
        Ok(())
    }
}