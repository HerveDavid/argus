use bevy::prelude::*;

use crate::settings::ecs::{
    game_master::events::NetworkMeasureEvent, nats::events::NatsEvent,
    scada::components::ScadaSubscription,
};

pub fn nats_receiver_to_events(
    mut subscriptions: Query<&mut ScadaSubscription>,
    mut event_writer: EventWriter<NatsEvent>,
) {
    for mut subscription in subscriptions.iter_mut() {
        while let Ok(message) = subscription.receiver.try_recv() {
            event_writer.write(message);
        }
    }
}

pub fn nats_to_scada(
    mut events: EventReader<NatsEvent>,
    mut network_writer: EventWriter<NetworkMeasureEvent>,
) {
    for event in events.read() {
        if let Ok(network_event) = serde_json::from_str::<NetworkMeasureEvent>(&event.payload) {
            network_writer.write(network_event);
        }
    }
}
