use bevy::prelude::*;

use super::{resources::Mode, systems::handle_switch_mode};

pub struct ModePlugin;

impl Plugin for ModePlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(Mode::default());
        app.add_systems(Update, handle_switch_mode);
    }
}
