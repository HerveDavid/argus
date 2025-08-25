use bevy::prelude::*;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::Arc;
use tokio::runtime::Runtime;

// ============================================================================
// COMPONENTS
// ============================================================================

/// Composant pour marquer une entité comme abonnée à un topic NATS
#[derive(Component)]
pub struct NatsSubscriber {
    pub topic: String,
    pub is_active: bool,
}

/// Composant pour marquer une entité comme publisher NATS
#[derive(Component)]
pub struct NatsPublisher {
    pub topic: String,
}

/// Composant pour stocker les données SCADA reçues
#[derive(Component, Debug, Clone)]
pub struct ScadaData {
    pub id: String,
    pub dynawo_id: String,
    pub value: Option<f64>,
    pub timestamp: u64,
    pub message_type: ScadaMessageType,
}

/// Composant pour identifier le type de message SCADA
#[derive(Component, Debug, Clone, PartialEq)]
pub enum ScadaMessageType {
    TsTm,
    Legacy,
    Fallback,
}

/// Composant pour les entités qui doivent publier leurs changements
#[derive(Component)]
pub struct PublishOnChange;

// ============================================================================
// RESOURCES
// ============================================================================

/// Resource principale pour gérer la connexion NATS
#[derive(Resource)]
pub struct NatsConnection {
    pub client: Arc<async_nats::Client>,
    pub runtime: Arc<Runtime>,
    pub event_receiver: Receiver<NatsIncomingEvent>,
    pub event_sender: Sender<NatsOutgoingEvent>,
    pub paused: Arc<AtomicBool>,
}

unsafe impl Send for NatsConnection {}
unsafe impl Sync for NatsConnection {}

/// Resource pour les événements entrants depuis NATS
#[derive(Debug, Clone)]
pub struct NatsIncomingEvent {
    pub topic: String,
    pub payload: String,
    pub entity_id: Option<Entity>,
}

/// Resource pour les événements sortants vers NATS
#[derive(Debug, Clone)]
pub struct NatsOutgoingEvent {
    pub topic: String,
    pub payload: String,
}

// ============================================================================
// EVENTS
// ============================================================================

/// Événement Bevy pour les messages SCADA reçus
#[derive(Event, Debug, Clone)]
pub struct ScadaMessageReceived {
    pub entity: Entity,
    pub data: ScadaData,
}

/// Événement Bevy pour publier sur NATS
#[derive(Event, Debug, Clone)]
pub struct PublishToNats {
    pub topic: String,
    pub payload: String,
}

/// Événement pour s'abonner à un nouveau topic
#[derive(Event)]
pub struct SubscribeToTopic {
    pub entity: Entity,
    pub topic: String,
}

/// Événement pour se désabonner d'un topic
#[derive(Event)]
pub struct UnsubscribeFromTopic {
    pub entity: Entity,
    pub topic: String,
}

// ============================================================================
// STRUCTURES DE DONNÉES SCADA
// ============================================================================

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TsTmMessage {
    pub id: String,
    pub dynawo_id: String,
    pub tase2: String,
    pub timestamp: u64,
    pub cause: String,
    pub validity: String,
    pub operator_blocked: bool,
    pub message_type: String,
    pub value: Option<f64>,
    pub st_val: Option<serde_json::Value>,
    pub tfos: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LegacyMessage {
    pub id: String,
    pub dynawo_id: String,
    pub value: Option<serde_json::Value>,
    pub time_sent: Option<f64>,
    pub time_received: Option<f64>,
}

// ============================================================================
// IMPLÉMENTATION NATSCONNECTION
// ============================================================================

impl NatsConnection {
    pub async fn new(nats_url: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let client = Arc::new(async_nats::connect(nats_url).await?);
        let runtime = Arc::new(Runtime::new()?);
        let (event_sender, event_receiver) = mpsc::channel();
        let paused = Arc::new(AtomicBool::new(false));

        Ok(NatsConnection {
            client,
            runtime,
            event_receiver,
            event_sender,
            paused,
        })
    }

    pub fn pause(&self) {
        self.paused.store(true, Ordering::Relaxed);
    }

    pub fn resume(&self) {
        self.paused.store(false, Ordering::Relaxed);
    }

    pub fn subscribe_to_topic(&self, topic: String, entity: Option<Entity>) {
        let client = self.client.clone();
        let sender = self.event_sender.clone();
        let paused = self.paused.clone();
        let topic_clone = topic.clone();

        self.runtime.spawn(async move {
            match client.subscribe(&topic).await {
                Ok(mut subscription) => {
                    info!("Successfully subscribed to topic: {}", topic);

                    while let Some(message) = subscription.next().await {
                        if paused.load(Ordering::Relaxed) {
                            continue;
                        }

                        if let Ok(payload) = std::str::from_utf8(&message.payload) {
                            let event = NatsIncomingEvent {
                                topic: topic_clone.clone(),
                                payload: payload.to_string(),
                                entity_id: entity,
                            };

                            if let Err(e) = sender.send(event) {
                                warn!("Failed to send NATS event: {}", e);
                                break;
                            }
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to subscribe to topic '{}': {}", topic, e);
                }
            }
        });
    }

    pub fn publish(&self, topic: String, payload: String) {
        let client = self.client.clone();

        self.runtime.spawn(async move {
            if let Err(e) = client.publish(&topic, payload.into()).await {
                error!("Failed to publish to topic '{}': {}", topic, e);
            }
        });
    }
}

// ============================================================================
// SYSTEMS
// ============================================================================

/// Système pour traiter les événements NATS entrants
pub fn handle_nats_incoming_events(
    nats: Res<NatsConnection>,
    mut scada_events: EventWriter<ScadaMessageReceived>,
    mut query: Query<(Entity, &mut ScadaData, &NatsSubscriber)>,
) {
    while let Ok(event) = nats.event_receiver.try_recv() {
        debug!("Received NATS event on topic: {}", event.topic);

        // Traiter le message JSON
        if let Ok(parsed_json) = serde_json::from_str::<serde_json::Value>(&event.payload) {
            let scada_data = process_nats_message(&parsed_json);

            // Si on a un entity_id spécifique, mettre à jour cette entité
            if let Some(entity_id) = event.entity_id {
                if let Ok((entity, mut data, _)) = query.get_mut(entity_id) {
                    *data = scada_data.clone();
                    scada_events.send(ScadaMessageReceived {
                        entity,
                        data: scada_data,
                    });
                }
            } else {
                // Sinon, trouver toutes les entités abonnées à ce topic
                for (entity, mut data, subscriber) in query.iter_mut() {
                    if subscriber.topic == event.topic && subscriber.is_active {
                        *data = scada_data.clone();
                        scada_events.send(ScadaMessageReceived {
                            entity,
                            data: scada_data.clone(),
                        });
                    }
                }
            }
        } else {
            warn!(
                "Failed to parse JSON from NATS message on topic: {}",
                event.topic
            );
        }
    }
}

/// Système pour publier des événements sur NATS
pub fn handle_nats_outgoing_events(
    mut events: EventReader<PublishToNats>,
    nats: Res<NatsConnection>,
) {
    for event in events.read() {
        nats.publish(event.topic.clone(), event.payload.clone());
    }
}

/// Système pour gérer les nouvelles souscriptions
pub fn handle_subscriptions(
    mut events: EventReader<SubscribeToTopic>,
    nats: Res<NatsConnection>,
    mut query: Query<&mut NatsSubscriber>,
) {
    for event in events.read() {
        if let Ok(mut subscriber) = query.get_mut(event.entity) {
            subscriber.topic = event.topic.clone();
            subscriber.is_active = true;
            nats.subscribe_to_topic(event.topic.clone(), Some(event.entity));
        }
    }
}

/// Système pour gérer les désinscriptions
pub fn handle_unsubscriptions(
    mut events: EventReader<UnsubscribeFromTopic>,
    mut query: Query<&mut NatsSubscriber>,
) {
    for event in events.read() {
        if let Ok(mut subscriber) = query.get_mut(event.entity) {
            subscriber.is_active = false;
        }
    }
}

/// Système pour publier automatiquement les changements
pub fn publish_changes_system(
    mut publish_events: EventWriter<PublishToNats>,
    query: Query<(&ScadaData, &NatsPublisher, &PublishOnChange), Changed<ScadaData>>,
) {
    for (data, publisher, _) in query.iter() {
        if let Ok(payload) = serde_json::to_string(data) {
            publish_events.send(PublishToNats {
                topic: publisher.topic.clone(),
                payload,
            });
        }
    }
}

/// Système pour afficher les messages SCADA reçus (exemple)
pub fn display_scada_messages(mut events: EventReader<ScadaMessageReceived>) {
    for event in events.read() {
        info!(
            "SCADA message received for entity {:?}: ID={}, Value={:?}, Type={:?}",
            event.entity, event.data.id, event.data.value, event.data.message_type
        );
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Convertit un message JSON NATS en ScadaData
fn process_nats_message(message: &serde_json::Value) -> ScadaData {
    let id = message
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();

    let dynawo_id = message
        .get("dynawo_id")
        .and_then(|v| v.as_str())
        .unwrap_or(&id)
        .to_string();

    // Déterminer le type de message et extraire les valeurs
    if message.get("tase2").is_some() {
        // Format TS/TM
        let timestamp = message.get("ts").and_then(|v| v.as_u64()).unwrap_or(0);
        let value = message.get("value").and_then(|v| v.as_f64());

        ScadaData {
            id,
            dynawo_id,
            value,
            timestamp,
            message_type: ScadaMessageType::TsTm,
        }
    } else {
        // Format Legacy
        let value = message.get("value").and_then(|v| v.as_f64());
        let timestamp = message
            .get("time_received")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0) as u64;

        ScadaData {
            id,
            dynawo_id,
            value,
            timestamp,
            message_type: ScadaMessageType::Legacy,
        }
    }
}

// ============================================================================
// PLUGIN
// ============================================================================

pub struct ScadaPlugin {
    pub nats_url: String,
}

impl Plugin for ScadaPlugin {
    fn build(&self, app: &mut App) {
        // Créer la connexion NATS
        let rt = Runtime::new().expect("Failed to create Tokio runtime");
        let nats_connection = rt.block_on(async {
            NatsConnection::new(&self.nats_url)
                .await
                .expect("Failed to connect to NATS")
        });

        app.insert_resource(nats_connection)
            .add_event::<ScadaMessageReceived>()
            .add_event::<PublishToNats>()
            .add_event::<SubscribeToTopic>()
            .add_event::<UnsubscribeFromTopic>()
            .add_systems(
                Update,
                (
                    handle_nats_incoming_events,
                    handle_nats_outgoing_events,
                    handle_subscriptions,
                    handle_unsubscriptions,
                    publish_changes_system,
                    display_scada_messages,
                )
                    .chain(),
            );
    }
}
