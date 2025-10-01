use bevy::prelude::*;
use log::{info, warn};

use crate::{
    powsybl::{components::Feeder, events::UpdateFeederEvent},
    scada::{components::ScadaOutput, events::NetworkMeasureEvent},
};

pub fn handle_feeder_event(
    mut events: EventReader<UpdateFeederEvent>,
    outputs: Query<&ScadaOutput>,
    mut feeders: Query<&mut Feeder>,
) {
    if outputs.is_empty() {
        return;
    }

    if feeders.is_empty() {
        return;
    }

    for event in events.read() {
        info!(
            "Received UpdateFeederEvent - id: {}, value: {}",
            event.id, event.value
        );

        let matching_output = outputs.iter().find(|output| {
            let matches = event.id == output.dynawo_id;
            if matches {
                info!(
                    "Matched dynawo_id {} to graphical_id {}",
                    output.dynawo_id, output.graphical_id
                );
            }
            matches
        });

        if let Some(output) = matching_output {
            let mut found_feeder = false;

            for mut feeder in feeders.iter_mut() {
                if feeder.id == output.graphical_id {
                    info!("Updating feeder {} with value {}", feeder.id, event.value);
                    feeder.update(event.value);
                    found_feeder = true;
                    break;
                }
            }

            if !found_feeder {
                warn!(
                    "No feeder found with graphical_id: {} (from dynawo_id: {})",
                    output.graphical_id, event.id
                );
            }
        } else {
            warn!("No ScadaOutput found for dynawo_id: {}", event.id);
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
                info!(
                    "NetworkMeasureEvent::TsTm - id: {}, value: {:?}",
                    msg.id, msg.value
                );
                feeder_writer.write(UpdateFeederEvent {
                    id: msg.id.clone(),
                    value: msg.value.unwrap_or(0.),
                });
            }
            NetworkMeasureEvent::Legacy(msg) => {
                info!(
                    "NetworkMeasureEvent::Legacy - id: {}, value: {}",
                    msg.id, msg.value
                );
                feeder_writer.write(UpdateFeederEvent {
                    id: msg.id.clone(),
                    value: msg.value,
                });
            }
        }
    }
}
