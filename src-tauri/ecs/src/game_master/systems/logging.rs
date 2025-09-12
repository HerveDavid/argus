use bevy::prelude::*;

use super::super::events::{StepDurationEvent, TimeEvent};

pub fn logging_time(mut events: EventReader<TimeEvent>) {
    for event in events.read() {
        println!("Time: {}", event.step);
    }
}

pub fn logging_step(mut events: EventReader<StepDurationEvent>) {
    for event in events.read() {
        println!("Step: {:?}", event);
    }
}
