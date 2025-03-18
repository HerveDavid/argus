use crate::state::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_http::reqwest;
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proxy {
    pub username: Option<String>,
    pub password: Option<String>,
    pub no_proxy: String,
    pub url: String,
}

impl Default for Proxy {
    fn default() -> Self {
        Self {
            username: None,
            password: None,
            no_proxy: "localhost".to_string(),
            url: "".to_string(),
        }
    }
}

#[derive(Error, Debug)]
pub enum ProxyError {
    #[error("HTTP client error: {0}")]
    HttpClient(#[from] reqwest::Error),

    #[error("Error accessing application state: {0}")]
    StateLock(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

// Implement Serialize for ProxyError for Tauri command compatibility
impl Serialize for ProxyError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Convenience conversion for returning errors from Tauri commands
impl From<ProxyError> for String {
    fn from(err: ProxyError) -> Self {
        err.to_string()
    }
}

#[derive(Debug, Serialize)]
pub struct ProxyResponse {
    status: String,
    url: String,
    no_proxy: String,
}

#[tauri::command(rename_all = "snake_case")]
pub fn load_client(state: State<'_, AppState>, proxy: Proxy) -> Result<ProxyResponse, ProxyError> {
    // Create the proxy with error handling
    let proxy_builder = reqwest::Proxy::https(&proxy.url)?;
    let proxy_reqwest = proxy_builder.no_proxy(reqwest::NoProxy::from_string(&proxy.no_proxy));

    // Build the client with error handling
    let client = reqwest::Client::builder().proxy(proxy_reqwest).build()?;

    // Lock the state with error handling
    let mut app_state = state
        .lock()
        .map_err(|e| ProxyError::StateLock(e.to_string()))?;

    app_state.client = client;

    // Return a meaningful response with configuration details from the original input
    Ok(ProxyResponse {
        status: "configured".to_string(),
        url: proxy.url.clone(),
        no_proxy: proxy.no_proxy.clone(),
    })
}
