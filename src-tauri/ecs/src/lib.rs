use bevy::prelude::*;

use async_runtime::AsyncRtPlugin;
use game_master::GameMasterPlugin;
use mode::ModePlugin;
use nats::NatsPlugin;
use powsybl::PowsyblPlugin;
use scada::ScadaPlugin;
use subscriber::SubscriberPlugin;
use tauri::{TauriPlugin, events::TauriEvent};
use tokio::sync::mpsc::UnboundedReceiver;

mod async_runtime;
mod game_master;
mod nats;
mod scada;
mod subscriber;

pub mod mode;
pub mod powsybl;
pub mod tauri;

pub fn create_app(receiver: UnboundedReceiver<TauriEvent>) -> App {
    let mut app = App::new();

    app.add_plugins((
        MinimalPlugins,
        AsyncRtPlugin,
        NatsPlugin,
        TauriPlugin::new(receiver),
        ModePlugin,
        SubscriberPlugin,
        GameMasterPlugin,
        ScadaPlugin,
        PowsyblPlugin,
    ));

    app
}
