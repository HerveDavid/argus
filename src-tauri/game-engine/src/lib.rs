use bevy::app::App;
use tauri::{
    command, plugin::{Builder, TauriPlugin}, AppHandle, Manager, Runtime, Window
};

mod commands;
mod desktop;
mod error;
mod states;

use desktop::PluginGameEngine;

pub use error::{Error, Result};

pub trait PluginGameEngineExt<R: Runtime> {
    fn plugin_game_engine(&self) -> &PluginGameEngine<R>;
}

impl<R: Runtime, T: Manager<R>> crate::PluginGameEngineExt<R> for T {
    fn plugin_game_engine(&self) -> &PluginGameEngine<R> {
        self.state::<PluginGameEngine<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("plugin-game-engine")
        .setup(|app, api| {
            let plugin_game_engine = desktop::init(app, api)?;
            app.manage(plugin_game_engine);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![pause, resume, stop])
        .build()
}

#[command]
fn pause<R:Runtime>(app: AppHandle<R>) {
    app.plugin_game_engine().pause();
    println!("pause");
}

#[command]
fn resume<R:Runtime>(app: AppHandle<R>) {
    app.plugin_game_engine().resume();
    println!("resume");
}

#[command]
fn stop<R:Runtime>(app: AppHandle<R>) {
    app.plugin_game_engine().stop();
    println!("stop");
}

