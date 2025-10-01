use bevy::prelude::*;

#[derive(Debug, Event)]
pub struct UpdateFeederEvent {
    pub id: String,
    pub value: f64,
}
