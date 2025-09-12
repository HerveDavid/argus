use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Event, Debug, Deserialize, Serialize)]
pub struct TimeEvent {
    pub step: i64,
}

impl From<&str> for TimeEvent {
    fn from(s: &str) -> Self {
        let step = s.parse::<i64>().expect("Impossible to convert number");
        Self { step }
    }
}
