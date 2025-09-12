use bevy::prelude::*;

use super::resources::Mode;

pub struct ModePlugin;

impl Plugin for ModePlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(Mode::default());
    }
}
