use bevy::prelude::*;
use log::{error, info, warn};
use serde_json::json;
use std::collections::HashSet;

use crate::scada::{
    components::{ScadaOutputResponse, ScadaSubscription},
    error::Result,
    resources::ScadaConfig,
};
use crate::{
    nats::{events::NatsEvent, resources::NatsClient},
    powsybl::resources::PowsyblClient,
    subscriber::events::SubscriptionEvent,
};

pub fn spawn_scada_output(
    mut events: EventReader<SubscriptionEvent>,
    mut commands: Commands,
    client: Res<PowsyblClient>,
) {
    for event in events.read() {
        let SubscriptionEvent(element_id, entity, ..) = event;

        info!("Spawning SCADA outputs for element_id: {}", element_id);

        if let Err(err) = spawner_scada_output(element_id, entity, &mut commands, &client) {
            error!("Error spawning SCADA output for {}: {}", element_id, err);
        }
    }
}

fn spawner_scada_output(
    element_id: &str,
    entity: &Entity,
    commands: &mut Commands,
    client: &Res<PowsyblClient>,
) -> Result<()> {
    let body = json!({
      "query": "SELECT s.* FROM scada_outputs s INNER JOIN game_master_outputs g ON s.dynawo_id = g.dynawo_id WHERE (g.substation = ?1 OR g.voltage_level = ?1) AND NULLIF(s.graphical_id, '') IS NOT NULL",
      "parameters": [element_id]
    });

    let response: ScadaOutputResponse = client.post("powsybl/query", &body)?;

    info!(
        "Found {} SCADA outputs for element_id: {}",
        response.outputs.len(),
        element_id
    );

    for output in response.outputs {
        info!(
            "Spawning ScadaOutput - dynawo_id: {}, graphical_id: {}, topic: {}, parent: {:?}",
            output.dynawo_id, output.graphical_id, output.topic, entity
        );
        commands.entity(*entity).with_children(|parent| {
            parent.spawn(output);
        });
    }

    Ok(())
}

pub fn spawn_scada_subscription(
    mut commands: Commands,
    config: Res<ScadaConfig>,
    nats: Res<NatsClient>,
    subscriptions: Query<(Entity, &Children), With<crate::subscriber::components::Subscription>>,
    new_outputs: Query<
        &crate::scada::components::ScadaOutput,
        Added<crate::scada::components::ScadaOutput>,
    >,
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

        info!(
            "Creating NATS subscriptions for parent entity {:?} with topics: {:?}",
            parent_entity, topics
        );

        for topic_name in topics {
            let full_topic = format!("{}.{}", config.topic, topic_name);
            info!("Creating NATS subscription for topic: {}", full_topic);

            let (sender, receiver) = tokio::sync::mpsc::unbounded_channel::<NatsEvent>();

            let topic_to_listener = full_topic.clone();
            match nats.create_listener_task(topic_to_listener.clone(), sender) {
                Ok(listener) => {
                    info!("Successfully created listener for topic: {}", full_topic);
                    commands.entity(parent_entity).with_children(|parent| {
                        parent.spawn(ScadaSubscription {
                            topic: full_topic.clone(),
                            receiver,
                            listener,
                        });
                    });
                }
                Err(err) => {
                    error!(
                        "Failed to create listener for topic {}: {}",
                        full_topic, err
                    );
                }
            }
        }
    }
}
