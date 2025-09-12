use bevy::prelude::*;

#[derive(Debug, Event)]
pub struct SubscriptionEvent(pub String, pub Entity);
