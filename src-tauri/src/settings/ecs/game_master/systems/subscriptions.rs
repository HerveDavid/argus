use bevy::prelude::*;
use serde_json::json;

use super::super::super::{
    game_master::{
        components::GameMasterOutputsResponse,
        error::Result,
        events::{ErrorEvent, ErrorSeverity},
    },
    nats::{events::NatsEvent, resources::NatsClient},
    powsybl::resources::PowsyblClient,
    subscriber::events::SubscriptionEvent,
};

use super::super::{
    components::GameMasterSubscription, events::TimeEvent, resources::GameMasterConfig,
};

pub fn spawn_game_master_subscription(
    mut events: EventReader<SubscriptionEvent>,
    mut commands: Commands,
    config: Res<GameMasterConfig>,
    nats: Res<NatsClient>,
) {
    for event in events.read() {
        let SubscriptionEvent(element_id, entity) = event;

        let topic = format!("{}.{}", config.topic, element_id.replace(".", "_")); // Sanitize substation_id before use as topic ('.' is a delimiter in NATS)
        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel::<NatsEvent>();

        let topic_to_listener = topic.clone();
        let listener = nats
            .create_listener_task(topic_to_listener, sender)
            .unwrap();

        commands.spawn((
            GameMasterSubscription {
                topic,
                receiver,
                listener,
            },
            ChildOf(entity.clone()),
        ));
    }
}

pub fn time(mut game_master: ResMut<GameMasterConfig>, mut event_writer: EventWriter<TimeEvent>) {
    while let Ok(message) = game_master.receiver.try_recv() {
        event_writer.write(message);
    }
}

pub fn spawn_game_master_output(
    mut events: EventReader<SubscriptionEvent>,
    mut commands: Commands,
    mut error_writer: EventWriter<ErrorEvent>,
    client: Res<PowsyblClient>,
) {
    for event in events.read() {
        let SubscriptionEvent(element_id, entity) = event;

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
      "query": "SELECT * FROM game_master_outputs WHERE topic = ? AND NULLIF(graphical_id, '') IS NOT NULL",
      "parameters": [element_id]
    });

    let response: GameMasterOutputsResponse = client.post("powsybl/query", &body)?;
    for output in response.outputs {
        commands.spawn((output, ChildOf(entity.clone())));
    }

    Ok(())
}
