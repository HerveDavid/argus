use crate::network::state::NetworkState;

use reqwest;

#[derive(Debug)]
pub struct AppStateInner {
    pub client: reqwest::Client,
    pub network: NetworkState,
}

impl Default for AppStateInner {
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

        Self {
            client,
            network: NetworkState::default(),
        }
    }
}

pub type AppState = std::sync::Mutex<AppStateInner>;
