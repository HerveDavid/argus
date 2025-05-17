use reqwest;
use std::sync::Arc;
use zeromq::Socket;

use crate::shared::entities::dynawo::GameMasterOutputs;

pub struct SettingsState {
    pub client: Arc<reqwest::Client>,
    pub server_url: Option<String>,
    pub zmq_client: Arc<zeromq::SubSocket>,
    pub zmq_url: Option<String>,

    // input files from haulogy works
    pub game_master_outputs: Option<GameMasterOutputs>,
}

impl Default for SettingsState {
    fn default() -> Self {
        // Create the proxy with error handling
        let proxy = crate::settings::entities::Proxy::default();
        let proxy_builder = reqwest::Proxy::https(&proxy.url).unwrap();
        let proxy_reqwest = proxy_builder.no_proxy(reqwest::NoProxy::from_string(&proxy.no_proxy));

        // Build the client with error handling
        let client = reqwest::Client::builder()
            .proxy(proxy_reqwest)
            .build()
            .unwrap();

        // Build the zeromq client
        let zmq_client = zeromq::SubSocket::new();

        Self {
            client: Arc::new(client),
            server_url: None,
            zmq_client: Arc::new(zmq_client),
            zmq_url: Some("".to_string()),
            game_master_outputs: None,
        }
    }
}
