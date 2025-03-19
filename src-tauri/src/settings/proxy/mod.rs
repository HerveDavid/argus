use super::entities::Proxy;
use super::errors::{SettingResult, SettingsError};
use crate::state::AppState;

use serde::Serialize;
use tauri::State;
use tauri_plugin_http::reqwest;

#[derive(Debug, Serialize)]
pub struct ProxyResponse {
    pub status: String,
    pub url: String,
    pub no_proxy: String,
}

#[tauri::command(rename_all = "snake_case")]
pub fn load_client(state: State<'_, AppState>, proxy: Proxy) -> SettingResult<ProxyResponse> {
    // Create the proxy with error handling
    let proxy_builder = reqwest::Proxy::https(&proxy.url)?;
    let proxy_reqwest = proxy_builder.no_proxy(reqwest::NoProxy::from_string(&proxy.no_proxy));

    // Build the client with error handling
    let client = reqwest::Client::builder().proxy(proxy_reqwest).build()?;

    // Lock the state with error handling
    let mut app_state = state
        .lock()
        .map_err(|e| SettingsError::StateLock(e.to_string()))?;

    app_state.client = client;

    // Return a meaningful response with configuration details from the original input
    Ok(ProxyResponse {
        status: "configured".to_string(),
        url: proxy.url.clone(),
        no_proxy: proxy.no_proxy.clone(),
    })
}
