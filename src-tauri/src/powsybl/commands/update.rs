use std::collections::HashMap;
use tauri::State;

use crate::sessions::state::SessionState;

use super::super::entities::*;
use super::super::error::Result;



#[tauri::command(rename_all = "snake_case")]
pub async fn update_battery(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    battery_id: String,
    target_p: Option<f64>,
    target_q: Option<f64>,
    connected: Option<bool>,
    max_q: Option<f64>,
    min_q: Option<f64>,
    fictitious: Option<bool>,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let mut form_data = HashMap::new();
    if let Some(val) = target_p { form_data.insert("target_p".to_string(), val.to_string()); }
    if let Some(val) = target_q { form_data.insert("target_q".to_string(), val.to_string()); }
    if let Some(val) = connected { form_data.insert("connected".to_string(), val.to_string()); }
    if let Some(val) = max_q { form_data.insert("max_q".to_string(), val.to_string()); }
    if let Some(val) = min_q { form_data.insert("min_q".to_string(), val.to_string()); }
    if let Some(val) = fictitious { form_data.insert("fictitious".to_string(), val.to_string()); }

    let endpoint = format!("powsybl/update/battery/{}", battery_id);
    let response = session.post_form::<QueryResponse>(&endpoint, form_data).await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_generator(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    generator_id: String,
    target_p: Option<f64>,
    max_p: Option<f64>,
    min_p: Option<f64>,
    rated_s: Option<f64>,
    target_v: Option<f64>,
    target_q: Option<f64>,
    voltage_regulator_on: Option<bool>,
    regulated_element_id: Option<String>,
    p: Option<f64>,
    q: Option<f64>,
    connected: Option<bool>,
    fictitious: Option<bool>,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let mut form_data = HashMap::new();
    if let Some(val) = target_p { form_data.insert("target_p".to_string(), val.to_string()); }
    if let Some(val) = max_p { form_data.insert("max_p".to_string(), val.to_string()); }
    if let Some(val) = min_p { form_data.insert("min_p".to_string(), val.to_string()); }
    if let Some(val) = rated_s { form_data.insert("rated_s".to_string(), val.to_string()); }
    if let Some(val) = target_v { form_data.insert("target_v".to_string(), val.to_string()); }
    if let Some(val) = target_q { form_data.insert("target_q".to_string(), val.to_string()); }
    if let Some(val) = voltage_regulator_on { form_data.insert("voltage_regulator_on".to_string(), val.to_string()); }
    if let Some(val) = regulated_element_id { form_data.insert("regulated_element_id".to_string(), val); }
    if let Some(val) = p { form_data.insert("p".to_string(), val.to_string()); }
    if let Some(val) = q { form_data.insert("q".to_string(), val.to_string()); }
    if let Some(val) = connected { form_data.insert("connected".to_string(), val.to_string()); }
    if let Some(val) = fictitious { form_data.insert("fictitious".to_string(), val.to_string()); }

    let endpoint = format!("powsybl/update/generator/{}", generator_id);
    let response = session.post_form::<QueryResponse>(&endpoint, form_data).await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_switch(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    switch_id: String,
    open: bool,
    retained: Option<bool>,
    fictitious: Option<bool>,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let mut form_data = HashMap::new();
    form_data.insert("open".to_string(), open.to_string());
    if let Some(val) = retained { form_data.insert("retained".to_string(), val.to_string()); }
    if let Some(val) = fictitious { form_data.insert("fictitious".to_string(), val.to_string()); }

    let endpoint = format!("powsybl/update/switch/{}", switch_id);
    let response = session.post_form::<QueryResponse>(&endpoint, form_data).await?;
    Ok(response)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_load(
    session_state: State<'_, tokio::sync::Mutex<SessionState>>,
    load_id: String,
    p0: Option<f64>,
    q0: Option<f64>,
    connected: Option<bool>,
    fictitious: Option<bool>,
) -> Result<QueryResponse> {
    let session = session_state.lock().await;

    let mut form_data = HashMap::new();
    if let Some(val) = p0 { form_data.insert("p0".to_string(), val.to_string()); }
    if let Some(val) = q0 { form_data.insert("q0".to_string(), val.to_string()); }
    if let Some(val) = connected { form_data.insert("connected".to_string(), val.to_string()); }
    if let Some(val) = fictitious { form_data.insert("fictitious".to_string(), val.to_string()); }

    let endpoint = format!("powsybl/update/load/{}", load_id);
    let response = session.post_form::<QueryResponse>(&endpoint, form_data).await?;
    Ok(response)
}