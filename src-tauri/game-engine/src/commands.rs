use bevy::prelude::*;
use crossbeam::channel::Receiver;

use crate::states::EngineState;

#[derive(Debug)]
pub enum EngineCommand {
    Pause,
    Resume,
    Stop,
}

#[derive(Resource)]
pub struct ChannelCommand(pub Receiver<EngineCommand>);

pub fn handle_commands(command: Res<ChannelCommand>, mut engine_state: ResMut<EngineState>) {
    if let Ok(command) = command.0.try_recv() {
        match command {
            EngineCommand::Pause => {
                engine_state.is_pause = true;
            }
            EngineCommand::Resume => {
                *engine_state = EngineState {
                    is_running: true,
                    is_pause: true,
                }
            }
            EngineCommand::Stop => engine_state.is_running = false,
        }
    }
}
