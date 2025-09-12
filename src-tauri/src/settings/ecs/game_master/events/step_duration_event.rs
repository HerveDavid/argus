use bevy::prelude::*;
use serde::{Deserialize, Serialize};

use crate::settings::ecs::game_master::events::MeasureEvent;

#[derive(Event, Debug, Deserialize, Serialize)]
pub struct StepDurationEvent {
    pub duration_ms: f64,
}

impl TryFrom<&MeasureEvent> for StepDurationEvent {
    type Error = ();

    fn try_from(event: &MeasureEvent) -> Result<Self, Self::Error> {
        event
            .values
            .get("Simulation_stepDurationMs")
            .map(|&duration_ms| StepDurationEvent { duration_ms })
            .ok_or(())
    }
}
