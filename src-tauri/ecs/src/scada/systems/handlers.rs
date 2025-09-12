use bevy::prelude::*;

use crate::{
    powsybl::{components::Feeder, events::UpdateFeederEvent},
    scada::{components::ScadaOutput, events::NetworkMeasureEvent},
};

pub fn handle_feeder_event(
    mut events: EventReader<UpdateFeederEvent>,
    outputs: Query<&mut ScadaOutput>,
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
        match event {
            NetworkMeasureEvent::TsTm(msg) => {
                feeder_writer.write(UpdateFeederEvent {
                    id: msg.id.clone(),
                    value: msg.value.unwrap_or(0.),
                });
            }
            NetworkMeasureEvent::Legacy(msg) => {
                feeder_writer.write(UpdateFeederEvent {
                    id: msg.id.clone(),
                    value: msg.value,
                });
            }
        }
    }
}
