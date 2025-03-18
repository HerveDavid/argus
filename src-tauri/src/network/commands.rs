use crate::network::entities::{Substation, Substations, VoltageLevel, VoltageLevels};
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
                .map_err(|_e| format!("JSON parsing error: invalid type: map, expected a sequence at line 1 column 0. Raw response: {}", text))?
        }
    };

    let mut state = state.lock().unwrap();
    state.substations = substations.clone();
    Ok(substations)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_voltage_levels(state: State<'_, AppState>) -> Result<Vec<VoltageLevel>, String> {
    let proxy = reqwest::Proxy::https("http://localhost:1234")
        .unwrap()
        .no_proxy(reqwest::NoProxy::from_string("localhost"));
    let client = reqwest::Client::builder().proxy(proxy).build().unwrap();
    let res = client
        .get("http://localhost:8000/api/v1/network/voltage-levels")
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
    
    // Debug the raw response
    println!("Raw response (first 200 chars): {}", &text.chars().take(200).collect::<String>());
    
    // Try to parse as a container with voltage_levels field first
    let container_result: Result<VoltageLevels, serde_json::Error> = serde_json::from_str(&text);
    
    let voltage_levels = if let Ok(container) = container_result {
        // Successfully parsed as a container
        println!("Parsed as VoltageLevels container");
        container.voltage_levels
    } else {
        // Try parsing as direct array of voltage levels
        println!("Trying to parse as direct array");
        let array_result: Result<Vec<VoltageLevel>, serde_json::Error> = serde_json::from_str(&text);
        
        match array_result {
            Ok(levels) => {
                println!("Successfully parsed as array with {} items", levels.len());
                levels
            }
            Err(e) => {
                // If both parsing attempts fail, return a detailed error
                let error_msg = format!(
                    "JSON parsing error: Could not parse as VoltageLevels or Vec<VoltageLevel>. Error: {}. 
                    Raw response (first 200 chars): {}", 
                    e, 
                    &text.chars().take(200).collect::<String>()
                );
                println!("{}", error_msg);
                return Err(error_msg);
            }
        }
    };
    
    let mut state = state.lock().unwrap();
    state.voltage_levels = voltage_levels.clone();
    Ok(voltage_levels)
}
