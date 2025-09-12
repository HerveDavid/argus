use bevy::prelude::*;

use crate::settings::ecs::powsybl::components::Feeder;
use crate::settings::ecs::powsybl::events::UpdateFeederEvent;

use super::super::components::GameMasterOutput;
use super::super::events::NetworkMeasureEvent;

pub fn handle_feeder_event(
    mut events: EventReader<UpdateFeederEvent>,
    outputs: Query<&mut GameMasterOutput>,
    mut feeders: Query<&mut Feeder>,
) {
    if outputs.is_empty() || feeders.is_empty() {
        return;
    }

    for event in events.read() {
        if let Some(matching_output) = outputs.iter().find(|output| event.id == output.dynawo_id) {
            for mut feeder in feeders.iter_mut() {
                if feeder.id == matching_output.graphical_id {
                    feeder.update(event.value);
                    break;
                }
            }
        }
    }
}

pub fn handle_measure_to_feeder(
    mut events: EventReader<NetworkMeasureEvent>,
    mut feeder_writer: EventWriter<UpdateFeederEvent>,
) {
    for event in events.read() {
        feeder_writer.write(UpdateFeederEvent {
            id: event.key.clone(),
            value: event.value,
        });
    }
}
