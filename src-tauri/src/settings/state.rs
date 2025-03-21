use reqwest;

#[derive(Debug)]
pub struct SettingsState {
    pub client: reqwest::Client,
    pub server_url: Option<String>,
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

        Self {
            client,
            server_url: None,
        }
    }
}
