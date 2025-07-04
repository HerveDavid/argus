use crate::entities::iidm::{Substation, VoltageLevel};
use crate::powsybl::error::{PowsyblError, PowsyblResult};
use serde_json::{json, Value};
use sqlx::{Pool, Sqlite};
use std::collections::{BTreeMap, HashMap};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, Mutex as TokioMutex};
use tokio::task::JoinHandle;
use tokio::time::timeout;
use uuid::Uuid;
use zeromq::{Socket, SocketRecv, SocketSend, ZmqMessage};

const BROKER_PUB_ENDPOINT: &str = "tcp://localhost:10242";
const BROKER_SUB_ENDPOINT: &str = "tcp://localhost:10241";
const POWSYBL_REQUEST_TOPIC: &str = "powsybl.request";
const POWSYBL_RESPONSE_TOPIC: &str = "powsybl.response";

#[derive(Debug)]
pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

pub struct PowsyblState {
    pub substations: BTreeMap<String, Substation>,
    pub voltage_levels: HashMap<String, VoltageLevel>,
    pub ti_subscriptions: HashMap<String, SubscriptionHandle>,

    // Connexions ZMQ
    pub_socket: zeromq::PubSocket,
    sub_socket: Arc<TokioMutex<zeromq::SubSocket>>,
    pending_requests: Arc<TokioMutex<HashMap<String, tokio::sync::oneshot::Sender<Value>>>>,

    // Handle pour la tâche d'écoute
    _listening_task: Option<JoinHandle<()>>,
}

impl PowsyblState {
    pub async fn new() -> PowsyblResult<tokio::sync::Mutex<Self>> {
        let substations = BTreeMap::default();
        let voltage_levels = HashMap::default();
        let ti_subscriptions = HashMap::default();

        let mut pub_socket = zeromq::PubSocket::new();
        let mut sub_socket = zeromq::SubSocket::new();
        let pending_requests = Arc::new(TokioMutex::new(HashMap::default()));

        // Connexion aux sockets
        pub_socket.connect(BROKER_PUB_ENDPOINT).await?;
        sub_socket.connect(BROKER_SUB_ENDPOINT).await?;
        sub_socket.subscribe(POWSYBL_RESPONSE_TOPIC).await?;

        // Attendre que les connexions s'établissent
        tokio::time::sleep(Duration::from_millis(100)).await;

        let sub_socket = Arc::new(TokioMutex::new(sub_socket));

        let mut state = Self {
            substations,
            voltage_levels,
            ti_subscriptions,
            pub_socket,
            sub_socket: sub_socket.clone(),
            pending_requests: pending_requests.clone(),
            _listening_task: None,
        };

        // Démarrer la tâche d'écoute
        let listening_task = Self::start_listening_task(sub_socket, pending_requests).await;
        state._listening_task = Some(listening_task);

        Ok(tokio::sync::Mutex::new(state))
    }

    pub fn spawn_task<F>(&mut self, id: String, task_fn: F)
    where
        F: FnOnce(broadcast::Receiver<()>) -> JoinHandle<()>,
    {
        let (shutdown_tx, shutdown_rx) = broadcast::channel(1);
        let handle = task_fn(shutdown_rx);

        self.ti_subscriptions.insert(
            id,
            SubscriptionHandle {
                handle,
                shutdown_sender: shutdown_tx,
            },
        );
    }

    pub fn stop_task(&mut self, id: &str) -> bool {
        if let Some(task) = self.ti_subscriptions.remove(id) {
            let _ = task.shutdown_sender.send(());
            task.handle.abort();
            true
        } else {
            false
        }
    }

    pub fn has_task(&self, id: &str) -> bool {
        self.ti_subscriptions.contains_key(id)
    }

    // Méthode statique pour démarrer la tâche d'écoute
    async fn start_listening_task(
        sub_socket: Arc<TokioMutex<zeromq::SubSocket>>,
        pending_requests: Arc<TokioMutex<HashMap<String, tokio::sync::oneshot::Sender<Value>>>>,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            loop {
                // Acquérir le verrou sur la socket
                let message_result = {
                    let mut socket = sub_socket.lock().await;
                    socket.recv().await
                };

                match message_result {
                    Ok(message) => {
                        if let Ok((request_id, response)) =
                            Self::parse_response_message(message).await
                        {
                            // Acquérir le verrou sur pending_requests et traiter la réponse
                            let mut pending = pending_requests.lock().await;
                            if let Some(sender) = pending.remove(&request_id) {
                                if let Err(_) = sender.send(response) {
                                    log::warn!(
                                        "Impossible d'envoyer la réponse pour ID: {}",
                                        request_id
                                    );
                                }
                            } else {
                                log::warn!("Aucune requête en attente pour ID: {}", request_id);
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Erreur lors de la réception du message: {}", e);
                        tokio::time::sleep(Duration::from_millis(100)).await;
                    }
                }
            }
        })
    }

    async fn parse_response_message(message: ZmqMessage) -> PowsyblResult<(String, Value)> {
        let message_bytes = message
            .get(0)
            .ok_or_else(|| PowsyblError::JsonParseError("Message vide".to_string()))?;

        let message_str = std::str::from_utf8(message_bytes)
            .map_err(|e| PowsyblError::JsonParseError(format!("Erreur UTF-8: {}", e)))?;

        if let Some(space_pos) = message_str.find(' ') {
            let topic = &message_str[..space_pos];
            let json_payload = &message_str[space_pos + 1..];

            if topic == POWSYBL_RESPONSE_TOPIC {
                let response: Value = serde_json::from_str(json_payload)
                    .map_err(|e| PowsyblError::JsonParseError(format!("Erreur JSON: {}", e)))?;

                // Extraire l'ID de la requête
                if let Some(request_id) = response.get("id").and_then(|id| id.as_str()) {
                    log::debug!("Réponse reçue pour requête ID: {}", request_id);
                    return Ok((request_id.to_string(), response));
                }
            }
        }

        Err(PowsyblError::JsonParseError(
            "Format de réponse invalide".to_string(),
        ))
    }

    pub async fn send_request(
        &mut self,
        method: &str,
        params: Option<Value>,
        timeout_duration: Duration,
    ) -> PowsyblResult<Value> {
        let request_id = Uuid::new_v4().to_string();

        let request = json!({
            "type": "request",
            "id": request_id,
            "method": method,
            "params": params.unwrap_or(json!({}))
        });

        // Créer un channel pour recevoir la réponse
        let (tx, rx) = tokio::sync::oneshot::channel();

        // Insérer dans pending_requests
        {
            let mut pending = self.pending_requests.lock().await;
            pending.insert(request_id.clone(), tx);
        }

        // Envoyer la requête avec le topic powsybl.request (comme attendu par le Python)
        let message = format!(
            "{} {}",
            POWSYBL_REQUEST_TOPIC,
            serde_json::to_string(&request)?
        );
        self.pub_socket.send(message.into()).await?;

        log::debug!("Requête envoyée: {} (ID: {})", method, request_id);

        // Attendre la réponse avec timeout
        match timeout(timeout_duration, rx).await {
            Ok(Ok(response)) => {
                // Vérifier le statut de la réponse
                if let Some(status) = response.get("status").and_then(|s| s.as_i64()) {
                    if status >= 400 {
                        let error_msg = response
                            .get("result")
                            .and_then(|r| r.get("error"))
                            .and_then(|e| e.as_str())
                            .unwrap_or("Erreur inconnue");
                        return Err(PowsyblError::ApiError(error_msg.to_string()));
                    }
                }

                // Retourner le résultat
                if let Some(result) = response.get("result") {
                    Ok(result.clone())
                } else {
                    Err(PowsyblError::JsonParseError(
                        "Pas de résultat dans la réponse".to_string(),
                    ))
                }
            }
            Ok(Err(_)) => Err(PowsyblError::JsonParseError(
                "Erreur du channel de réponse".to_string(),
            )),
            Err(_) => {
                // Nettoyer la requête en timeout
                let mut pending = self.pending_requests.lock().await;
                pending.remove(&request_id);
                Err(PowsyblError::ApiError(format!(
                    "Timeout pour la requête {} (ID: {})",
                    method, request_id
                )))
            }
        }
    }
}

impl Drop for PowsyblState {
    fn drop(&mut self) {
        // Nettoyer les tâches en cours
        for (_, subscription) in self.ti_subscriptions.drain() {
            let _ = subscription.shutdown_sender.send(());
            subscription.handle.abort();
        }

        // Arrêter la tâche d'écoute si elle existe
        if let Some(task) = &self._listening_task {
            task.abort();
        }
    }
}
