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
    subscriptions: Query<Entity, (With<crate::subscriber::components::Subscription>, Without<ScadaSubscription>)>,
) {
    // Only create one subscription per parent entity, using a wildcard to catch all topics
    for parent_entity in subscriptions.iter() {
        info!(
            "Creating wildcard NATS subscription for parent entity {:?}",
            parent_entity
        );

        // Use wildcard to subscribe to all topics under the config prefix
        let wildcard_topic = format!("{}.*", config.topic);
        info!("Creating NATS subscription for wildcard topic: {}", wildcard_topic);

        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel::<NatsEvent>();

        match nats.create_listener_task(wildcard_topic.clone(), sender) {
            Ok(listener) => {
                info!("Successfully created listener for wildcard topic: {}", wildcard_topic);
                commands.entity(parent_entity).with_children(|parent| {
                    parent.spawn(ScadaSubscription {
                        topic: wildcard_topic.clone(),
                        receiver,
                        listener,
                    });
                });
            }
            Err(err) => {
                error!(
                    "Failed to create listener for wildcard topic {}: {}",
                    wildcard_topic, err
                );
            }
        }
    }
}