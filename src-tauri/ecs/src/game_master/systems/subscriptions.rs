use bevy::prelude::*;
use serde_json::json;
use std::collections::HashSet;

use crate::{
    game_master::{
        components::{GameMasterOutput, GameMasterOutputsResponse, GameMasterSubscription},
        events::{ErrorEvent, ErrorSeverity},
    },
    nats::{events::NatsEvent, resources::NatsClient},
    powsybl::resources::PowsyblClient,
    subscriber::events::SubscriptionEvent,
};

use super::super::{error::Result, events::TimeEvent, resources::GameMasterConfig};

pub fn spawn_game_master_output(
    mut events: EventReader<SubscriptionEvent>,
    mut commands: Commands,
    mut error_writer: EventWriter<ErrorEvent>,
    client: Res<PowsyblClient>,
) {
    for event in events.read() {
        let SubscriptionEvent(element_id, entity, ..) = event;

        if let Err(err) = spawner_game_master_output(element_id, entity, &mut commands, &client) {
            error_writer.write(ErrorEvent {
                message: err.to_string(),
                severity: ErrorSeverity::Recoverable,
            });
        }
    }
}

fn spawner_game_master_output(
    element_id: &str,
    entity: &Entity,
    commands: &mut Commands,
    client: &Res<PowsyblClient>,
) -> Result<()> {
    let body = json!({
      "query": "SELECT * FROM game_master_outputs WHERE (substation = ?1 OR voltage_level = ?1) AND NULLIF(graphical_id, '') IS NOT NULL",
      "parameters": [element_id]
    });

    let response: GameMasterOutputsResponse = client.post("powsybl/query", &body)?;

    for output in response.outputs {
        commands.entity(*entity).with_children(|parent| {
            parent.spawn(output);
        });
    }

    Ok(())
}

pub fn spawn_game_master_subscription(
    mut commands: Commands,
    config: Res<GameMasterConfig>,
    nats: Res<NatsClient>,
    subscriptions: Query<(Entity, &Children), With<crate::subscriber::components::Subscription>>,
    new_outputs: Query<&GameMasterOutput, Added<GameMasterOutput>>,
    existing_subscriptions: Query<&GameMasterSubscription>,
) {
    for (parent_entity, children) in subscriptions.iter() {
        let mut topics = HashSet::new();

        for child in children.iter() {
            if let Ok(output) = new_outputs.get(child) {
                topics.insert(output.topic.clone());
            }
        }

        if topics.is_empty() {
            continue;
        }

        // Get all existing subscription topics to avoid duplicates
        let existing_topics: HashSet<String> = existing_subscriptions
            .iter()
            .map(|sub| sub.topic.clone())
            .collect();

        // Create one subscription per unique topic, only if it doesn't exist
        for topic_name in topics {
            let full_topic = format!("{}.{}", config.topic, topic_name.replace(".", "_"));

            // Skip if subscription already exists
            if existing_topics.contains(&full_topic) {
                log::info!(
                    "Subscription already exists for topic: {}, skipping",
                    full_topic
                );
                continue;
            }

            let (sender, receiver) = tokio::sync::mpsc::unbounded_channel::<NatsEvent>();

            match nats.create_listener_task(full_topic.clone(), sender) {
                Ok(listener) => {
                    commands.entity(parent_entity).with_children(|parent| {
                        parent.spawn(GameMasterSubscription {
                            topic: full_topic.clone(),
                            receiver,
                            listener,
                        });
                    });
                    log::info!("Created new subscription for topic: {}", full_topic);
                }
                Err(err) => {
                    log::error!(
                        "Failed to create listener for topic {}: {}",
                        full_topic,
                        err
                    );
                }
            }
        }
    }
}

pub fn time(mut game_master: ResMut<GameMasterConfig>, mut event_writer: EventWriter<TimeEvent>) {
    while let Ok(message) = game_master.receiver.try_recv() {
        event_writer.write(message);
    }
}
