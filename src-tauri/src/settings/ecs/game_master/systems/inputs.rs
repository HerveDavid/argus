use bevy::prelude::*;

use crate::settings::ecs::nats::events::NatsEvent;

use super::super::{
    components::GameMasterSubscription,
    events::{MeasureEvent, NetworkMeasureEvent, StepDurationEvent},
};

pub fn nats_to_game_master(
    mut events: EventReader<NatsEvent>,
    mut measure_writer: EventWriter<MeasureEvent>,
    mut step_writer: EventWriter<StepDurationEvent>,
    mut network_writer: EventWriter<NetworkMeasureEvent>,
) {
    for event in events.read() {
        let measure_event = MeasureEvent::from(event.payload.as_str());

        if let Ok(step_event) = StepDurationEvent::try_from(&measure_event) {
            step_writer.write(step_event);
        }
        if let Ok(network_event) = NetworkMeasureEvent::try_from(&measure_event) {
            network_writer.write(network_event);
        }

        measure_writer.write(measure_event);
    }
}

pub fn nats_receiver_to_events(
    mut subscriptions: Query<&mut GameMasterSubscription>,
    mut event_writer: EventWriter<NatsEvent>,
) {
    for mut subscription in subscriptions.iter_mut() {
        while let Ok(message) = subscription.receiver.try_recv() {
            event_writer.write(message);
        }
    }
}
