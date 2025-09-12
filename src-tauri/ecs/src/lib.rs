use bevy::prelude::*;

use game_master::GameMasterPlugin;
use mode::ModePlugin;
use nats::NatsPlugin;
use powsybl::PowsyblPlugin;
use scada::ScadaPlugin;
use subscriber::SubscriberPlugin;
use tokio::AsyncRtPlugin;

mod game_master;
mod mode;
mod nats;
mod powsybl;
mod scada;
mod subscriber;
mod tokio;

pub fn create_app() -> App {
    let mut app = App::new();

    app.add_plugins((
        MinimalPlugins,
        AsyncRtPlugin,
        NatsPlugin,
        ModePlugin,
        SubscriberPlugin,
        GameMasterPlugin,
        ScadaPlugin,
        PowsyblPlugin,
    ));

    app
}
