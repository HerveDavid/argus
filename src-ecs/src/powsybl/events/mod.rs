use bevy::prelude::*;

#[derive(Event)]
pub struct UpdateFeederEvent {
    pub id: String,
    pub value: f64,
}
