use super::entities::{Substation, Substations};
use crate::state::AppState;

use tauri::State;
use tauri_plugin_http::reqwest;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_substations(state: State<'_, AppState>) -> Result<Vec<Substation>, String> {
    let proxy = reqwest::Proxy::https("http://localhost:1234")
        .unwrap()
        .no_proxy(reqwest::NoProxy::from_string("localhost"));

    let client = reqwest::Client::builder().proxy(proxy).build().unwrap();

    let res = client
        .get("http://localhost:8000/api/v1/network/substations")
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("API returned status code: {}", res.status()));
    }

    let text = res
        .text()
        .await
        .map_err(|e| format!("Text parsing error: {}", e))?;

    // Try to parse as a container with substations field first
    let result: Result<Substations, serde_json::Error> = serde_json::from_str(&text);

    let substations = match result {
        Ok(response) => {
            // Successfully parsed as a container
            response.substations
        }
        Err(_) => {
            // Try parsing as direct array of substations
            serde_json::from_str(&text)
                .map_err(|e| format!("JSON parsing error: invalid type: map, expected a sequence at line 1 column 0. Raw response: {}", text))?
        }
    };

    let mut state = state.lock().unwrap();
    state.substations = substations.clone();
    Ok(substations)
}
