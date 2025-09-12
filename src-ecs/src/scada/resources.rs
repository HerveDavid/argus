use bevy::prelude::*;

const TOPIC: &str = "HMI.SCADA";

#[derive(Resource)]
pub struct ScadaConfig {
    pub topic: &'static str,
}

impl FromWorld for ScadaConfig {
    fn from_world(_world: &mut World) -> Self {
        Self { topic: TOPIC }
    }
}
