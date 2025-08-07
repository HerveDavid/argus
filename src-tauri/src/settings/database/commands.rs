use std::collections::HashMap;

use serde_json::Value;
use tauri::State;
use tokio::sync::Mutex;

use super::error::Result;
use super::state::DatabaseState;
use sqlx::Row;

#[tauri::command(rename_all = "snake_case")]
pub async fn set_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    value: Value,
) -> Result<()> {
    let db = state.lock().await;
    db.set_setting(&key, &value).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
) -> Result<Option<Value>> {
    let db = state.lock().await;
    db.get_setting::<Value>(&key).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_setting_with_default(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    default_value: Value,
) -> Result<Value> {
    let db = state.lock().await;
    match db.get_setting::<Value>(&key).await? {
        Some(value) => Ok(value),
        None => Ok(default_value),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_setting_or_default(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
) -> Result<Value> {
    let db = state.lock().await;
    db.get_setting_or_default::<Value>(&key).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn merge_settings(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    new_value: Value,
) -> Result<()> {
    let db = state.lock().await;
    db.merge_settings(&key, &new_value).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_nested_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    path: String,
    value: Value,
) -> Result<()> {
    let db = state.lock().await;
    db.set_nested_setting(&key, &path, &value).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_nested_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    path: String,
) -> Result<Value> {
    let db = state.lock().await;
    db.get_nested_setting::<Value>(&key, &path).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_setting(state: State<'_, Mutex<DatabaseState>>, key: String) -> Result<bool> {
    let db = state.lock().await;
    db.delete_setting(&key).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_all_settings(
    state: State<'_, Mutex<DatabaseState>>,
) -> Result<HashMap<String, Value>> {
    let db = state.lock().await;
    db.list_settings().await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn setting_exists(state: State<'_, Mutex<DatabaseState>>, key: String) -> Result<bool> {
    let db = state.lock().await;
    match db.get_setting::<Value>(&key).await? {
        Some(_) => Ok(true),
        None => Ok(false),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn clear_all_settings(state: State<'_, Mutex<DatabaseState>>) -> Result<u64> {
    let db = state.lock().await;
    let result = sqlx::query("DELETE FROM settings")
        .execute(&db.pool)
        .await?;
    Ok(result.rows_affected())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn count_settings(state: State<'_, Mutex<DatabaseState>>) -> Result<i64> {
    let db = state.lock().await;
    let row = sqlx::query("SELECT COUNT(*) as count FROM settings")
        .fetch_one(&db.pool)
        .await?;
    Ok(row.get("count"))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_string_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    value: String,
) -> Result<()> {
    let db = state.lock().await;
    db.set_setting(&key, &value).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_string_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
) -> Result<Option<String>> {
    let db = state.lock().await;
    db.get_setting::<String>(&key).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_bool_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    value: bool,
) -> Result<()> {
    let db = state.lock().await;
    db.set_setting(&key, &value).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_bool_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
) -> Result<Option<bool>> {
    let db = state.lock().await;
    db.get_setting::<bool>(&key).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_number_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
    value: f64,
) -> Result<()> {
    let db = state.lock().await;
    db.set_setting(&key, &value).await
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_number_setting(
    state: State<'_, Mutex<DatabaseState>>,
    key: String,
) -> Result<Option<f64>> {
    let db = state.lock().await;
    db.get_setting::<f64>(&key).await
}
