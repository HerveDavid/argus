use bevy::prelude::*;
use log::{error, info};
use serde_json::json;

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
      "query": "SELECT s.*, CASE WHEN g.voltage_level = ?1 THEN g.voltage_level WHEN g.substation = ?1 THEN g.substation END as topic FROM scada_outputs s INNER JOIN game_master_outputs g ON s.dynawo_id = g.dynawo_id WHERE (g.substation = ?1 OR g.voltage_level = ?1) AND NULLIF(s.graphical_id, '') IS NOT NULL",
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
    subscriptions: Query<
        Entity,
        (
            With<crate::subscriber::components::Subscription>,
            Without<ScadaSubscription>,
        ),
    >,
) {
    let wildcard_topic = format!("{}.>", config.topic);

    // Create a subscription for each parent entity
    for parent_entity in subscriptions.iter() {
        info!(
            "Creating NATS subscription for entity {:?} with topic: {}",
            parent_entity, wildcard_topic
        );

        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel::<NatsEvent>();

        match nats.create_listener_task(wildcard_topic.clone(), sender) {
            Ok(listener) => {
                info!(
                    "Successfully created listener for topic: {} on entity {:?}",
                    wildcard_topic, parent_entity
                );
                
                // Add the ScadaSubscription component directly to the parent entity
                // This prevents the infinite loop by making the entity no longer match the query
                commands.entity(parent_entity).insert(ScadaSubscription {
                    topic: wildcard_topic.clone(),
                    receiver,
                    listener,
                });
            }
            Err(err) => {
                error!(
                    "Failed to create listener for topic {} on entity {:?}: {}",
                    wildcard_topic, parent_entity, err
                );
            }
        }
    }
}