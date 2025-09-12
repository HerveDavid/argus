use bevy::prelude::*;
use serde::{Deserialize, Serialize};

use crate::settings::ecs::game_master::events::MeasureEvent;

#[derive(Event, Debug, Deserialize, Serialize)]
pub struct NetworkMeasureEvent {
    pub key: String,
    pub value: f64,
}

impl TryFrom<&MeasureEvent> for NetworkMeasureEvent {
    type Error = ();

    fn try_from(event: &MeasureEvent) -> Result<Self, Self::Error> {
        event
            .values
            .iter()
            .find(|(key, _)| *key != "Simulation_stepDurationMs")
            .map(|(key, &value)| NetworkMeasureEvent {
                key: key.clone(),
                value,
            })
            .ok_or(())
    }
}
