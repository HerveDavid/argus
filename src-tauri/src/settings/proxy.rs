use crate::state::AppState;

use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_http::reqwest;

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

#[tauri::command(rename_all = "snake_case")]
pub async fn load_client(state: State<'_, AppState>, proxy: Proxy) -> Result<(), String> {
    let proxy = reqwest::Proxy::https(&proxy.url)
        .unwrap()
        .no_proxy(reqwest::NoProxy::from_string(&proxy.no_proxy));
    let client = reqwest::Client::builder().proxy(proxy).build().unwrap();

    let mut state = state.lock().unwrap();
    state.client = client;

    Ok(())
}
