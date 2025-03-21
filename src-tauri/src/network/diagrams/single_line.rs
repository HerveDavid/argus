use crate::network::errors::{NetworkError, NetworkResult};
use crate::state::AppState;
use reqwest;
use serde::de::Error;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Metadata and SVG result structure
#[derive(Serialize, Deserialize)]
pub struct DiagramResult {
    svg: String,
    metadata: serde_json::Value,
}

/// Gets a single line diagram with metadata for a specific line ID
#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram_with_metadata(
    state: State<'_, AppState>,
    line_id: String,
) -> NetworkResult<DiagramResult> {
    // Clone the client to avoid holding MutexGuard across await
    let (client, server_url) = {
        let app_state = state.read().map_err(|_| NetworkError::LockError)?;
        let server_url = app_state
            .settings
            .server_url
            .clone()
            .ok_or(NetworkError::ServerUrlNotConfigured)?;
        (app_state.settings.client.clone(), server_url)
    };

    // First try the unified endpoint
    match fetch_unified_diagram(&client, &server_url, &line_id).await {
        Ok(result) => Ok(result),
        Err(err) => {
            // Log the error and fallback to separate requests
            println!("Unified request failed, using fallback: {}", err);
            fetch_separate_diagram_and_metadata(&client, &server_url, &line_id).await
        }
    }
}

/// Gets only the SVG diagram for a specific line ID
#[tauri::command(rename_all = "snake_case")]
pub async fn get_single_line_diagram(
    state: State<'_, AppState>,
    line_id: String,
) -> NetworkResult<Vec<u8>> {
    // Reuse the with_metadata function and extract just the SVG
    let result = get_single_line_diagram_with_metadata(state, line_id).await?;
    Ok(result.svg.into_bytes())
}

/// Attempts to fetch the diagram and metadata in a single request
async fn fetch_unified_diagram(
    client: &reqwest::Client,
    server_url: &str,
    line_id: &str,
) -> NetworkResult<DiagramResult> {
    let url = format!(
        "{}/api/v1/network/diagram/line/{}?format=json",
        server_url, line_id
    );

    let response = client.get(&url).send().await?;

    if !response.status().is_success() {
        return Err(NetworkError::ApiError(response.status().to_string()));
    }

    let text = response.text().await?;

    let data: serde_json::Value = serde_json::from_str(&text).map_err(|e| {
        println!("JSON parse error: {}", e);
        println!("Response text: {}", text);
        NetworkError::JsonParseError(e)
    })?;

    // Extract svg
    let svg = data
        .get("svg")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            NetworkError::JsonParseError(serde_json::Error::custom("Missing 'svg' field"))
        })?
        .to_string();

    let metadata = data
        .get("metadata")
        .ok_or_else(|| {
            NetworkError::JsonParseError(serde_json::Error::custom("Missing 'metadata' field"))
        })?
        .clone();

    Ok(DiagramResult { svg, metadata })
}

/// Retrieves only the SVG diagram
async fn fetch_diagram_svg(
    client: &reqwest::Client,
    server_url: &str,
    line_id: &str,
) -> NetworkResult<String> {
    let url = format!("{}/api/v1/network/diagram/line/{}", server_url, line_id);
    let response = client.get(url).send().await?;

    if !response.status().is_success() {
        return Err(NetworkError::ApiError(response.status().to_string()));
    }

    Ok(response.text().await?)
}

/// Retrieves only the diagram metadata
async fn fetch_diagram_metadata(
    client: &reqwest::Client,
    server_url: &str,
    line_id: &str,
) -> NetworkResult<serde_json::Value> {
    let url = format!(
        "{}/api/v1/network/diagram/line/{}/metadata",
        server_url, line_id
    );

    let response = client.get(url).send().await?;

    if !response.status().is_success() {
        return Err(NetworkError::ApiError(response.status().to_string()));
    }

    Ok(serde_json::Value::String(response.text().await?))
}

/// Retrieves the diagram and metadata in two separate requests
async fn fetch_separate_diagram_and_metadata(
    client: &reqwest::Client,
    server_url: &str,
    line_id: &str,
) -> NetworkResult<DiagramResult> {
    // Execute both requests in parallel
    let svg_future = fetch_diagram_svg(client, server_url, line_id);
    let metadata_future = fetch_diagram_metadata(client, server_url, line_id);

    let (svg, metadata) = futures::join!(svg_future, metadata_future);

    Ok(DiagramResult {
        svg: svg?,
        metadata: metadata?,
    })
}
