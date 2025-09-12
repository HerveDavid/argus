use bevy::prelude::*;

use super::{events::NatsEvent, resources::NatsClient};

pub struct NatsPlugin;

impl Plugin for NatsPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<NatsClient>();
        app.add_event::<NatsEvent>();
    }
}
