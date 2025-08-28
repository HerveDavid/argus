use bevy::prelude::*;

mod components;
mod events;
mod resources;
mod systems;

pub struct ScadaPlugin;

impl Plugin for ScadaPlugin {
    fn build(&self, app: &mut App) {}
}
