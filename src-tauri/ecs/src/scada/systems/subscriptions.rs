use bevy::prelude::*;
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

        if let Err(err) = spawner_scada_output(element_id, entity, &mut commands, &client) {
            eprintln!("Error scada output: {}", err);
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
    for output in response.outputs {
        commands.spawn((output, ChildOf(entity.clone())));
    }

    Ok(())
}

pub fn spawn_scada_subscription(
    mut events: EventReader<SubscriptionEvent>,
    mut commands: Commands,
    config: Res<ScadaConfig>,
    nats: Res<NatsClient>,
) {
    for event in events.read() {
        let SubscriptionEvent(element_id, entity, ..) = event;

        let topic = format!("{}.{}", config.topic, element_id.replace(".", "_")); // Sanitize substation_id before use as topic ('.' is a delimiter in NATS)
        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel::<NatsEvent>();

        let topic_to_listener = topic.clone();
        let listener = nats
            .create_listener_task(topic_to_listener, sender)
            .unwrap();

        commands.spawn((
            ScadaSubscription {
                topic,
                receiver,
                listener,
            },
            ChildOf(entity.clone()),
        ));
    }
}
