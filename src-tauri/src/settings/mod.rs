use errors::SettingResult;
use serde_json::Value;
use sqlx::{Pool, Sqlite};

mod config;
mod proxy;
mod url;
mod zmq;

pub mod commands;
pub mod entities;
pub mod errors;
pub mod state;

pub async fn save_setting(pool: &Pool<Sqlite>, key: &str, value: &Value) -> SettingResult<()> {
    let json_str = value.to_string();

    sqlx::query(
        "INSERT INTO settings (key, value) VALUES (?, json(?))
         ON CONFLICT(key) DO UPDATE SET value = json(?)",
    )
    .bind(key)
    .bind(&json_str)
    .bind(&json_str)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_setting(pool: &Pool<Sqlite>, key: &str) -> SettingResult<Option<Value>> {
    let result = sqlx::query_as::<_, (String,)>("SELECT value FROM settings WHERE key = ?")
        .bind(key)
        .fetch_optional(pool)
        .await?;

    Ok(result.map(|(json_str,)| serde_json::from_str(&json_str).unwrap()))
}

pub async fn get_setting_value(
    pool: &Pool<Sqlite>,
    key: &str,
    path: &str,
) -> SettingResult<Option<Value>> {
    let result =
        sqlx::query_as::<_, (String,)>("SELECT json_extract(value, ?) FROM settings WHERE key = ?")
            .bind(path)
            .bind(key)
            .fetch_optional(pool)
            .await?;

    Ok(result.and_then(|(json_str,)| {
        if json_str == "null" {
            None
        } else {
            Some(serde_json::from_str(&json_str).unwrap())
        }
    }))
}

pub async fn update_setting_value(
    pool: &Pool<Sqlite>,
    key: &str,
    path: &str,
    new_value: &str,
) -> SettingResult<()> {
    sqlx::query(
        "UPDATE settings 
         SET value = json_set(value, ?, json(?)) 
         WHERE key = ?",
    )
    .bind(path)
    .bind(new_value)
    .bind(key)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn merge_setting(pool: &Pool<Sqlite>, key: &str, updates: &Value) -> SettingResult<()> {
    let existing = get_setting(pool, key).await?;

    let final_value = match existing {
        Some(mut existing_json) => {
            merge_json(&mut existing_json, updates);
            existing_json
        }
        None => updates.clone(),
    };

    save_setting(pool, key, &final_value).await?;

    Ok(())
}

pub fn merge_json(target: &mut Value, source: &Value) {
    if let (Some(target_obj), Some(source_obj)) = (target.as_object_mut(), source.as_object()) {
        for (key, value) in source_obj {
            if !target_obj.contains_key(key) {
                target_obj.insert(key.clone(), value.clone());
            } else if value.is_object() {
                merge_json(&mut target_obj[key], value);
            } else {
                target_obj.insert(key.clone(), value.clone());
            }
        }
    }
}

pub async fn remove_setting_property(
    pool: &Pool<Sqlite>,
    key: &str,
    path: &str,
) -> SettingResult<()> {
    sqlx::query(
        "UPDATE settings 
         SET value = json_remove(value, ?) 
         WHERE key = ?",
    )
    .bind(path)
    .bind(key)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_all_setting_keys(pool: &Pool<Sqlite>) -> SettingResult<Vec<String>> {
    let rows = sqlx::query_as::<_, (String,)>("SELECT key FROM settings")
        .fetch_all(pool)
        .await?;

    Ok(rows.into_iter().map(|(key,)| key).collect())
}
