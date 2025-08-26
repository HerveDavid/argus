use std::sync::Arc;

use bevy::prelude::*;

const ADDRESS: &str = "nats://localhost:4222";
const SHUTDOWN_TIMEOUT_SECS: u64 = 5;

#[derive(Resource)]
pub enum BrokerClient {
    Idle,
    Connecting { endpoint: String },
    Connected { client: Arc<async_nats::Client> },
}

impl Default for BrokerClient {
    fn default() -> Self {
        BrokerClient::Idle
    }
}

pub struct ScadaPlugin;

impl Plugin for ScadaPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(BrokerClient::Idle);
    }
}

fn test_system(broker: Res<BrokerClient>) {
    if let BrokerClient::Connected { client } = broker.as_ref() {}
}
