use std::{
    sync::{Arc, Mutex},
    thread::JoinHandle,
};

use bevy::{
    app::{App, Startup, Update},
    prelude::{Commands, Component, Query, Res},
    MinimalPlugins,
};
use crossbeam::channel::{bounded, Sender};
use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::{
    commands::{handle_commands, ChannelCommand, EngineCommand},
    states::EngineState,
};

pub struct PluginGameEngine<R: Runtime> {
    app_handle: AppHandle<R>,
    game_engine: Option<JoinHandle<()>>,
    command_sender: Sender<EngineCommand>,
    engine_state: Arc<Mutex<EngineState>>,
}

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<PluginGameEngine<R>> {
    // Init sender and receiver
    let (command_sender, command_receiver) = bounded::<EngineCommand>(32);
    let engine_state = Arc::new(Mutex::new(EngineState {
        is_running: true,
        is_pause: false,
    }));

    // Init game engine
    let game_engine = std::thread::spawn(|| {
        let mut game_engine = App::new();
        game_engine
            .add_plugins(MinimalPlugins)
            .insert_resource(ChannelCommand(command_receiver));

        // Internal plugins
        game_engine
            .add_systems(Update, handle_commands)
            .add_systems(Startup, add_positions)
            .add_systems(Update, print_position_system);

        game_engine.run();
    });

    Ok(PluginGameEngine {
        app_handle: app.clone(),
        game_engine: Some(game_engine),
        command_sender,
        engine_state,
    })
}

impl<R: Runtime> PluginGameEngine<R> {
    pub fn pause(&self) -> Result<(), String> {
        self.command_sender
            .send(EngineCommand::Pause)
            .map_err(|e| e.to_string())
    }

    pub fn resume(&self) -> Result<(), String> {
        self.command_sender
            .send(EngineCommand::Resume)
            .map_err(|e| e.to_string())
    }

    pub fn stop(&self) -> Result<(), String> {
        self.command_sender
            .send(EngineCommand::Stop)
            .map_err(|e| e.to_string())
    }

    pub fn is_paused(&self) -> bool {
        self.engine_state.lock().unwrap().is_pause
    }

    pub fn is_running(&self) -> bool {
        self.engine_state.lock().unwrap().is_running
    }
}

impl<R: Runtime> Drop for PluginGameEngine<R> {
    fn drop(&mut self) {
        let _ = self.stop();
        if let Some(handle) = self.game_engine.take() {
            let _ = handle.join();
        }
    }
}

#[derive(Component)]
pub struct Position {
    x: f32,
    y: f32,
}

fn print_position_system(query: Query<&Position>, res: Res<EngineState>) {
    if res.is_running {
        for position in &query {
            println!("position: {} {}", position.x, position.y);
        }
    }
}

fn add_positions(mut commands: Commands) {
    commands.spawn(Position { x: 0.0, y: 0.0 });
}
