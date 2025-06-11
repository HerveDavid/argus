use std::collections::HashMap;

use serde::Serialize;
use serde_json::{Map, Value};
use sqlx::{Pool, Row, Sqlite, SqlitePool};
use tauri::{AppHandle, Manager};

use super::error::{Error, Result};

pub struct DatabaseState {
    pub pool: Pool<Sqlite>,
}

impl DatabaseState {
    pub async fn new(app_handle: &AppHandle) -> Result<tokio::sync::Mutex<Self>> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("failed to get app dir");

        // Ensure the app directory exists
        std::fs::create_dir_all(&app_dir)?;

        let pool_path = app_dir.join("argus.db");

        // Set the DATABASE_URL environment variable to point to this SQLite files
        std::env::set_var("DATABASE_URL", format!("sqlite://{}", pool_path.display()));

        println!("Setup argus database at: {:?}", pool_path);

        let conn_options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&pool_path)
            .create_if_missing(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);

        let pool = SqlitePool::connect_with(conn_options).await?;

        // Run migrations regardless of whether the database is new
        // SQLx will track which migrations have been run
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(tokio::sync::Mutex::new(Self { pool }))
    }

    pub async fn set_setting<T: Serialize>(&self, key: &str, value: &T) -> Result<()> {
        let json_value = serde_json::to_string(value)?;
        sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
            .bind(key)
            .bind(json_value)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_setting<T: for<'de> serde::Deserialize<'de>>(
        &self,
        key: &str,
    ) -> Result<Option<T>> {
        let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            let json_value: String = row.get("value");
            let value: T = serde_json::from_str(&json_value)?;
            Ok(Some(value))
        } else {
            Ok(None)
        }
    }

    pub async fn get_setting_or_default<T: for<'de> serde::Deserialize<'de> + Default>(
        &self,
        key: &str,
    ) -> Result<T> {
        match self.get_setting::<T>(key).await? {
            Some(value) => Ok(value),
            None => Ok(T::default()),
        }
    }

    pub async fn merge_settings<T: for<'de> serde::Deserialize<'de> + Serialize>(
        &self,
        key: &str,
        new_value: &T,
    ) -> Result<()> {
        let existing: Option<T> = self.get_setting(key).await?;
        let merged = match existing {
            Some(existing_value) => {
                let base_json = serde_json::to_value(existing_value)?;
                let new_json = serde_json::to_value(new_value)?;
                self.merge_values(&base_json, &new_json)
            }
            None => serde_json::to_value(new_value)?,
        };
        self.set_setting(key, &merged).await
    }

    pub async fn set_nested_setting<T: Serialize>(
        &self,
        key: &str,
        path: &str,
        value: &T,
    ) -> Result<()> {
        let mut existing = match self.get_setting(key).await {
            Ok(Some(value)) => value,
            Ok(None) | Err(Error::SettingNotFound(_)) => Value::Object(Map::new()),
            Err(e) => return Err(e),
        };

        let json_value = serde_json::to_value(value)?;
        self.set_nested_value(&mut existing, path, &json_value)?;
        self.set_setting(key, &existing).await
    }

    pub async fn get_nested_setting<T: for<'de> serde::Deserialize<'de>>(
        &self,
        key: &str,
        path: &str,
    ) -> Result<T> {
        let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            let json_value: String = row.get("value");
            let value: serde_json::Value = serde_json::from_str(&json_value)?;
            let nested_value = self.get_nested_value(&value, path)?;
            let result: T = serde_json::from_value(nested_value)?;
            Ok(result)
        } else {
            Err(Error::SettingNotFound(key.to_string()))
        }
    }

    fn set_nested_value(&self, obj: &mut Value, path: &str, value: &Value) -> Result<()> {
        let parts: Vec<&str> = path.split('.').collect();
        let mut current = obj;

        for (i, part) in parts.iter().enumerate() {
            if i == parts.len() - 1 {
                // Dernière partie, on définit la valeur
                match current {
                    Value::Object(map) => {
                        map.insert(part.to_string(), value.clone());
                    }
                    _ => {
                        return Err(Error::InvalidPath(format!(
                            "Cannot set property '{}' on non-object",
                            part
                        )))
                    }
                }
            } else {
                // Parties intermédiaires, on navigue ou crée
                match current {
                    Value::Object(map) => {
                        if !map.contains_key(*part) {
                            map.insert(part.to_string(), Value::Object(Map::new()));
                        }
                        current = map.get_mut(*part).unwrap();
                    }
                    _ => {
                        return Err(Error::InvalidPath(format!(
                            "Cannot navigate through non-object at '{}'",
                            part
                        )))
                    }
                }
            }
        }

        Ok(())
    }

    pub async fn delete_setting(&self, key: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM settings WHERE key = ?")
            .bind(key)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn list_settings(&self) -> Result<HashMap<String, Value>> {
        let rows = sqlx::query("SELECT key, value FROM settings ORDER BY key")
            .fetch_all(&self.pool)
            .await?;

        let mut settings = HashMap::new();
        for row in rows {
            let key: String = row.get("key");
            let json_str: String = row.get("value");
            let value: Value = serde_json::from_str(&json_str)?;
            settings.insert(key, value);
        }

        Ok(settings)
    }

    fn get_nested_value(&self, obj: &Value, path: &str) -> Result<Value> {
        let parts: Vec<&str> = path.split('.').collect();
        let mut current = obj;

        for part in parts {
            match current {
                Value::Object(map) => {
                    current = map.get(part).ok_or_else(|| {
                        Error::InvalidPath(format!("Property '{}' not found", part))
                    })?;
                }
                _ => {
                    return Err(Error::InvalidPath(format!(
                        "Cannot navigate through non-object at '{}'",
                        part
                    )))
                }
            }
        }

        Ok(current.clone())
    }

    fn merge_values(&self, base: &Value, new: &Value) -> Value {
        match (base, new) {
            (Value::Object(base_map), Value::Object(new_map)) => {
                let mut merged = base_map.clone();
                for (key, value) in new_map {
                    merged.insert(
                        key.clone(),
                        match merged.get(key) {
                            Some(existing) => self.merge_values(existing, value),
                            None => value.clone(),
                        },
                    );
                }
                Value::Object(merged)
            }
            (Value::Array(base_arr), Value::Array(new_arr)) => {
                let mut merged = base_arr.clone();
                merged.extend(new_arr.clone());
                Value::Array(merged)
            }
            _ => new.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use serde_json::json;
    use sqlx::SqlitePool;

    // Fonction helper pour créer une base de données configurée
    async fn setup_test_db() -> DatabaseState {
        let pool = SqlitePool::connect(":memory:").await.unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        DatabaseState { pool }
    }

    #[tokio::test]
    #[ignore = "reason: This test is for manual verification of JSON value conversion (TODO)"]
    async fn test_json_value_conversion() {
        let db_state = setup_test_db().await;

        // Stocker avec json!() et récupérer comme types spécifiques
        db_state
            .set_setting("test_string", &json!("hello"))
            .await
            .unwrap();
        db_state
            .set_setting("test_number", &json!(123))
            .await
            .unwrap();
        db_state
            .set_setting("test_float", &json!(45.67))
            .await
            .unwrap();
        db_state
            .set_setting("test_bool", &json!(false))
            .await
            .unwrap();
        db_state
            .set_setting("test_array", &json!(["a", "b", "c"]))
            .await
            .unwrap();

        // Récupération comme Value puis conversion manuelle
        let string_val: Value = db_state.get_setting("test_string").await.unwrap().unwrap();
        if let Value::String(s) = string_val {
            assert_eq!(s, "hello");
        } else {
            panic!("Expected string value");
        }

        let number_val: Value = db_state.get_setting("test_number").await.unwrap().unwrap();
        if let Value::Number(n) = number_val {
            assert_eq!(n.as_i64().unwrap(), 123);
        } else {
            panic!("Expected number value");
        }

        // Récupération directe comme types Rust (devrait fonctionner avec json!())
        let direct_string: String = db_state.get_setting("test_string").await.unwrap().unwrap();
        assert_eq!(direct_string, "hello");

        let direct_number: i32 = db_state.get_setting("test_number").await.unwrap().unwrap();
        assert_eq!(direct_number, 123);

        let direct_float: f64 = db_state.get_setting("test_float").await.unwrap().unwrap();
        assert!((direct_float - 45.67).abs() < f64::EPSILON);

        let direct_bool: bool = db_state.get_setting("test_bool").await.unwrap().unwrap();
        assert_eq!(direct_bool, false);

        let direct_array: Vec<String> = db_state.get_setting("test_array").await.unwrap().unwrap();
        assert_eq!(direct_array, vec!["a", "b", "c"]);
    }

    // Structures de test personnalisées
    #[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
    struct TestConfig {
        name: String,
        version: u32,
        features: Vec<String>,
    }

    impl Default for TestConfig {
        fn default() -> Self {
            Self {
                name: "default".to_string(),
                version: 1,
                features: vec!["basic".to_string()],
            }
        }
    }

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct UserSettings {
        theme: String,
        language: String,
        notifications: bool,
        preferences: UserPreferences,
    }

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct UserPreferences {
        auto_save: bool,
        font_size: u32,
        sidebar_collapsed: bool,
    }

    // =============================================================================
    // Tests de base (set/get)
    // =============================================================================

    #[tokio::test]
    async fn test_basic_set_get() {
        let db_state = setup_test_db().await;

        let config = json!({
            "theme": "dark",
            "language": "fr"
        });
        db_state.set_setting("app_config", &config).await.unwrap();
        let retrieved: Value = db_state.get_setting("app_config").await.unwrap().unwrap();
        assert_eq!(config, retrieved);
    }

    #[tokio::test]
    async fn test_set_get_with_custom_struct() {
        let db_state = setup_test_db().await;

        let config = TestConfig {
            name: "test_app".to_string(),
            version: 42,
            features: vec!["feature1".to_string(), "feature2".to_string()],
        };

        db_state.set_setting("test_config", &config).await.unwrap();
        let retrieved: TestConfig = db_state.get_setting("test_config").await.unwrap().unwrap();
        assert_eq!(config, retrieved);
    }

    #[tokio::test]
    async fn test_get_nonexistent_setting() {
        let db_state = setup_test_db().await;

        let result: Option<String> = db_state.get_setting("nonexistent").await.unwrap();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_get_setting_or_default() {
        let db_state = setup_test_db().await;

        // Test avec une clé qui n'existe pas
        let default_config: TestConfig = db_state
            .get_setting_or_default("missing_config")
            .await
            .unwrap();
        assert_eq!(default_config, TestConfig::default());

        // Test avec une clé qui existe
        let custom_config = TestConfig {
            name: "custom".to_string(),
            version: 2,
            features: vec!["advanced".to_string()],
        };
        db_state
            .set_setting("existing_config", &custom_config)
            .await
            .unwrap();
        let retrieved_config: TestConfig = db_state
            .get_setting_or_default("existing_config")
            .await
            .unwrap();
        assert_eq!(retrieved_config, custom_config);
    }

    #[tokio::test]
    async fn test_overwrite_existing_setting() {
        let db_state = setup_test_db().await;

        // Première valeur
        let config1 = json!({"version": 1});
        db_state.set_setting("config", &config1).await.unwrap();

        // Deuxième valeur (écrasement)
        let config2 = json!({"version": 2, "new_field": "test"});
        db_state.set_setting("config", &config2).await.unwrap();

        let retrieved: Value = db_state.get_setting("config").await.unwrap().unwrap();
        assert_eq!(retrieved, config2);
        assert_ne!(retrieved, config1);
    }

    // =============================================================================
    // Tests pour des types primitifs avec Value JSON
    // =============================================================================

    #[tokio::test]
    #[ignore = "reason: This test is for manual verification of primitive types as JSON values (TODO)"]
    async fn test_primitive_types_as_json_values() {
        let db_state = setup_test_db().await;

        // Test avec Value directement pour éviter les problèmes de sérialisation
        db_state
            .set_setting("string_as_value", &Value::String("test".to_string()))
            .await
            .unwrap();
        let string_val: Value = db_state
            .get_setting("string_as_value")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(string_val, Value::String("test".to_string()));

        db_state
            .set_setting(
                "number_as_value",
                &Value::Number(serde_json::Number::from(42)),
            )
            .await
            .unwrap();
        let number_val: Value = db_state
            .get_setting("number_as_value")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(number_val, Value::Number(serde_json::Number::from(42)));

        db_state
            .set_setting("bool_as_value", &Value::Bool(true))
            .await
            .unwrap();
        let bool_val: Value = db_state
            .get_setting("bool_as_value")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(bool_val, Value::Bool(true));
    }

    // =============================================================================
    // Tests de fusion (merge)
    // =============================================================================

    #[tokio::test]
    async fn test_merge_json_deep() {
        let db_state = setup_test_db().await;

        let initial_config = json!({
            "theme": "light",
            "user": {
                "name": "John",
                "preferences": {
                    "notifications": true,
                    "auto_save": false
                }
            },
            "features": {
                "beta": false
            }
        });
        db_state
            .set_setting("config", &initial_config)
            .await
            .unwrap();

        let new_data = json!({
            "theme": "dark",
            "user": {
                "email": "john@example.com",
                "preferences": {
                    "language": "fr",
                    "auto_save": true
                }
            },
            "features": {
                "beta": true,
                "experimental": true
            },
            "new_section": {
                "value": 42
            }
        });
        db_state.merge_settings("config", &new_data).await.unwrap();

        let result: Value = db_state.get_setting("config").await.unwrap().unwrap();

        // Vérifications détaillées
        assert_eq!(result["theme"], "dark"); // Écrasé
        assert_eq!(result["user"]["name"], "John"); // Conservé
        assert_eq!(result["user"]["email"], "john@example.com"); // Ajouté
        assert_eq!(result["user"]["preferences"]["notifications"], true); // Conservé
        assert_eq!(result["user"]["preferences"]["language"], "fr"); // Ajouté
        assert_eq!(result["user"]["preferences"]["auto_save"], true); // Écrasé
        assert_eq!(result["features"]["beta"], true); // Écrasé
        assert_eq!(result["features"]["experimental"], true); // Ajouté
        assert_eq!(result["new_section"]["value"], 42); // Nouvelle section
    }

    #[tokio::test]
    async fn test_merge_arrays() {
        let db_state = setup_test_db().await;

        let initial = json!({
            "tags": ["tag1", "tag2"],
            "numbers": [1, 2, 3]
        });
        db_state.set_setting("arrays", &initial).await.unwrap();

        let new_data = json!({
            "tags": ["tag3", "tag4"],
            "numbers": [4, 5]
        });
        db_state.merge_settings("arrays", &new_data).await.unwrap();

        let result: Value = db_state.get_setting("arrays").await.unwrap().unwrap();
        assert_eq!(result["tags"], json!(["tag1", "tag2", "tag3", "tag4"]));
        assert_eq!(result["numbers"], json!([1, 2, 3, 4, 5]));
    }

    #[tokio::test]
    async fn test_merge_with_nonexistent_base() {
        let db_state = setup_test_db().await;

        let new_data = json!({
            "theme": "dark",
            "version": 1
        });

        // Fusion sur une clé qui n'existe pas encore
        db_state
            .merge_settings("new_config", &new_data)
            .await
            .unwrap();

        let result: Value = db_state.get_setting("new_config").await.unwrap().unwrap();
        assert_eq!(result, new_data);
    }

    // =============================================================================
    // Tests d'opérations imbriquées (nested)
    // =============================================================================

    #[tokio::test]
    async fn test_nested_operations_comprehensive() {
        let db_state = setup_test_db().await;

        let config = json!({
            "app": {
                "ui": {
                    "theme": "light",
                    "font": {
                        "family": "Arial",
                        "size": 12
                    }
                },
                "behavior": {
                    "auto_save": true
                }
            }
        });
        db_state.set_setting("config", &config).await.unwrap();

        // Modification de valeurs existantes
        db_state
            .set_nested_setting("config", "app.ui.theme", &json!("dark"))
            .await
            .unwrap();
        db_state
            .set_nested_setting("config", "app.ui.font.size", &json!(14))
            .await
            .unwrap();

        // Ajout de nouvelles valeurs
        db_state
            .set_nested_setting("config", "app.ui.font.weight", &json!("bold"))
            .await
            .unwrap();
        db_state
            .set_nested_setting("config", "app.ui.animations", &json!(true))
            .await
            .unwrap();
        db_state
            .set_nested_setting("config", "app.debug.enabled", &json!(false))
            .await
            .unwrap();

        // Vérifications
        let theme: String = db_state
            .get_nested_setting("config", "app.ui.theme")
            .await
            .unwrap();
        let font_size: i32 = db_state
            .get_nested_setting("config", "app.ui.font.size")
            .await
            .unwrap();
        let font_weight: String = db_state
            .get_nested_setting("config", "app.ui.font.weight")
            .await
            .unwrap();
        let animations: bool = db_state
            .get_nested_setting("config", "app.ui.animations")
            .await
            .unwrap();
        let auto_save: bool = db_state
            .get_nested_setting("config", "app.behavior.auto_save")
            .await
            .unwrap();
        let debug_enabled: bool = db_state
            .get_nested_setting("config", "app.debug.enabled")
            .await
            .unwrap();

        assert_eq!(theme, "dark");
        assert_eq!(font_size, 14);
        assert_eq!(font_weight, "bold");
        assert_eq!(animations, true);
        assert_eq!(auto_save, true); // Valeur conservée
        assert_eq!(debug_enabled, false);
    }

    #[tokio::test]
    async fn test_nested_with_complex_types() {
        let db_state = setup_test_db().await;

        let initial_config = json!({
            "users": {}
        });
        db_state
            .set_setting("system", &initial_config)
            .await
            .unwrap();

        let user_data = json!({
            "id": 123,
            "name": "Alice",
            "roles": ["admin", "user"],
            "settings": {
                "theme": "dark",
                "notifications": true
            }
        });

        db_state
            .set_nested_setting("system", "users.alice", &user_data)
            .await
            .unwrap();

        let retrieved_user: Value = db_state
            .get_nested_setting("system", "users.alice")
            .await
            .unwrap();
        assert_eq!(retrieved_user, user_data);

        let user_name: String = db_state
            .get_nested_setting("system", "users.alice.name")
            .await
            .unwrap();
        assert_eq!(user_name, "Alice");
    }

    // =============================================================================
    // Tests de gestion d'erreurs
    // =============================================================================

    #[tokio::test]
    async fn test_get_nested_setting_nonexistent_key() {
        let db_state = setup_test_db().await;

        let result = db_state
            .get_nested_setting::<String>("nonexistent", "path")
            .await;
        assert!(matches!(result, Err(Error::SettingNotFound(_))));
    }

    #[tokio::test]
    async fn test_get_nested_setting_invalid_path() {
        let db_state = setup_test_db().await;

        let config = json!({
            "simple_value": "not_an_object"
        });
        db_state.set_setting("config", &config).await.unwrap();

        let result = db_state
            .get_nested_setting::<String>("config", "simple_value.nonexistent")
            .await;
        assert!(matches!(result, Err(Error::InvalidPath(_))));
    }

    #[tokio::test]
    async fn test_set_nested_setting_invalid_path() {
        let db_state = setup_test_db().await;

        let config = json!({
            "simple_value": "not_an_object"
        });
        db_state.set_setting("config", &config).await.unwrap();

        let result = db_state
            .set_nested_setting("config", "simple_value.new_prop", &json!("value"))
            .await;
        assert!(matches!(result, Err(Error::InvalidPath(_))));
    }

    #[tokio::test]
    async fn test_set_nested_on_nonexistent_base() {
        let db_state = setup_test_db().await;

        // Devrait créer la structure de base automatiquement
        db_state
            .set_nested_setting("new_config", "app.ui.theme", &json!("dark"))
            .await
            .unwrap();

        let theme: String = db_state
            .get_nested_setting("new_config", "app.ui.theme")
            .await
            .unwrap();
        assert_eq!(theme, "dark");
    }

    // =============================================================================
    // Tests de suppression et listage
    // =============================================================================

    #[tokio::test]
    async fn test_delete_setting() {
        let db_state = setup_test_db().await;

        let config = json!({"test": "value"});
        db_state.set_setting("to_delete", &config).await.unwrap();

        // Vérifier que la clé existe
        let exists: Option<Value> = db_state.get_setting("to_delete").await.unwrap();
        assert!(exists.is_some());

        // Supprimer
        let deleted = db_state.delete_setting("to_delete").await.unwrap();
        assert!(deleted);

        // Vérifier que la clé n'existe plus
        let not_exists: Option<Value> = db_state.get_setting("to_delete").await.unwrap();
        assert!(not_exists.is_none());
    }

    #[tokio::test]
    async fn test_delete_nonexistent_setting() {
        let db_state = setup_test_db().await;

        let deleted = db_state.delete_setting("nonexistent").await.unwrap();
        assert!(!deleted);
    }

    #[tokio::test]
    async fn test_list_settings() {
        let db_state = setup_test_db().await;

        // Ajouter plusieurs configurations
        db_state
            .set_setting("config_a", &json!({"type": "A"}))
            .await
            .unwrap();
        db_state
            .set_setting("config_b", &json!({"type": "B"}))
            .await
            .unwrap();
        db_state
            .set_setting("config_c", &json!({"type": "C", "nested": {"value": 42}}))
            .await
            .unwrap();

        let all_settings = db_state.list_settings().await.unwrap();

        assert_eq!(all_settings.len(), 3);
        assert!(all_settings.contains_key("config_a"));
        assert!(all_settings.contains_key("config_b"));
        assert!(all_settings.contains_key("config_c"));

        assert_eq!(all_settings["config_a"]["type"], "A");
        assert_eq!(all_settings["config_b"]["type"], "B");
        assert_eq!(all_settings["config_c"]["type"], "C");
        assert_eq!(all_settings["config_c"]["nested"]["value"], 42);
    }

    #[tokio::test]
    async fn test_list_empty_settings() {
        let db_state = setup_test_db().await;

        let all_settings = db_state.list_settings().await.unwrap();
        assert!(all_settings.is_empty());
    }

    // =============================================================================
    // Tests de concurrence et performance
    // =============================================================================

    #[tokio::test]
    async fn test_concurrent_operations() {
        use tokio::task::JoinSet;

        let db_state = setup_test_db().await;
        let db_state = std::sync::Arc::new(db_state);

        let mut join_set = JoinSet::new();

        // Lancer plusieurs tâches concurrentes
        for i in 0..10 {
            let db_clone = db_state.clone();
            join_set.spawn(async move {
                let key = format!("concurrent_test_{}", i);
                let value = json!({"thread_id": i, "data": format!("data_{}", i)});

                db_clone.set_setting(&key, &value).await.unwrap();
                let retrieved: Value = db_clone.get_setting(&key).await.unwrap().unwrap();
                assert_eq!(retrieved, value);
            });
        }

        // Attendre que toutes les tâches se terminent
        while let Some(result) = join_set.join_next().await {
            result.unwrap();
        }

        // Vérifier que toutes les valeurs ont été correctement stockées
        let all_settings = db_state.list_settings().await.unwrap();
        assert_eq!(all_settings.len(), 10);

        for i in 0..10 {
            let key = format!("concurrent_test_{}", i);
            assert!(all_settings.contains_key(&key));
            assert_eq!(all_settings[&key]["thread_id"], i);
        }
    }

    #[tokio::test]
    async fn test_large_data_handling() {
        let db_state = setup_test_db().await;

        // Créer une structure de données volumineuse
        let mut large_config = json!({});
        for i in 0..1000 {
            large_config[format!("key_{}", i)] = json!({
                "id": i,
                "data": format!("large_data_string_{}", i),
                "nested": {
                    "array": (0..10).collect::<Vec<i32>>(),
                    "object": {
                        "prop1": format!("value_{}", i),
                        "prop2": i * 2,
                        "prop3": i % 2 == 0
                    }
                }
            });
        }

        // Stocker et récupérer
        db_state
            .set_setting("large_config", &large_config)
            .await
            .unwrap();
        let retrieved: Value = db_state.get_setting("large_config").await.unwrap().unwrap();

        assert_eq!(retrieved, large_config);

        // Test d'accès imbriqué sur une grande structure
        let nested_value: i32 = db_state
            .get_nested_setting("large_config", "key_500.nested.object.prop2")
            .await
            .unwrap();
        assert_eq!(nested_value, 1000);
    }

    // =============================================================================
    // Tests de types de données variés
    // =============================================================================

    #[tokio::test]
    #[ignore = "reason: This test is for manual verification of various data types (TODO)"]
    async fn test_various_data_types() {
        let db_state = setup_test_db().await;

        // String - doit être stocké comme Value JSON
        db_state
            .set_setting("string_val", &json!("test string"))
            .await
            .unwrap();
        let string_result: String = db_state.get_setting("string_val").await.unwrap().unwrap();
        assert_eq!(string_result, "test string");

        // Integer - doit être stocké comme Value JSON
        db_state.set_setting("int_val", &json!(42)).await.unwrap();
        let int_result: i32 = db_state.get_setting("int_val").await.unwrap().unwrap();
        assert_eq!(int_result, 42);

        // Float - doit être stocké comme Value JSON
        db_state
            .set_setting("float_val", &json!(3.14))
            .await
            .unwrap();
        let float_result: f64 = db_state.get_setting("float_val").await.unwrap().unwrap();
        assert!((float_result - 3.14).abs() < f64::EPSILON);

        // Boolean - doit être stocké comme Value JSON
        db_state
            .set_setting("bool_val", &json!(true))
            .await
            .unwrap();
        let bool_result: bool = db_state.get_setting("bool_val").await.unwrap().unwrap();
        assert_eq!(bool_result, true);

        // Array - doit être stocké comme Value JSON
        let array = vec!["item1", "item2", "item3"];
        db_state
            .set_setting("array_val", &json!(array))
            .await
            .unwrap();
        let array_result: Vec<String> = db_state.get_setting("array_val").await.unwrap().unwrap();
        assert_eq!(array_result, array);

        // Test avec des types primitifs Rust directs (alternative)
        #[derive(Serialize, Deserialize, PartialEq, Debug)]
        struct SimpleConfig {
            name: String,
            count: i32,
            enabled: bool,
        }

        let config = SimpleConfig {
            name: "test".to_string(),
            count: 100,
            enabled: false,
        };

        db_state.set_setting("rust_struct", &config).await.unwrap();
        let retrieved_config: SimpleConfig =
            db_state.get_setting("rust_struct").await.unwrap().unwrap();
        assert_eq!(retrieved_config, config);
    }

    #[tokio::test]
    async fn test_complex_struct_serialization() {
        let db_state = setup_test_db().await;

        let user_settings = UserSettings {
            theme: "dark".to_string(),
            language: "fr".to_string(),
            notifications: true,
            preferences: UserPreferences {
                auto_save: false,
                font_size: 16,
                sidebar_collapsed: true,
            },
        };

        db_state
            .set_setting("user_settings", &user_settings)
            .await
            .unwrap();
        let retrieved: UserSettings = db_state
            .get_setting("user_settings")
            .await
            .unwrap()
            .unwrap();

        assert_eq!(retrieved, user_settings);
        assert_eq!(retrieved.theme, "dark");
        assert_eq!(retrieved.preferences.font_size, 16);
    }

    // =============================================================================
    // Tests de cas limites
    // =============================================================================

    #[tokio::test]
    async fn test_empty_string_key() {
        let db_state = setup_test_db().await;

        let value = json!({"test": "empty key"});
        db_state.set_setting("", &value).await.unwrap();
        let retrieved: Value = db_state.get_setting("").await.unwrap().unwrap();
        assert_eq!(retrieved, value);
    }

    #[tokio::test]
    async fn test_special_characters_in_key() {
        let db_state = setup_test_db().await;

        let special_key = "key with spaces and symbols: éàç@#$%^&*()!";
        let value = json!({"special": true});

        db_state.set_setting(special_key, &value).await.unwrap();
        let retrieved: Value = db_state.get_setting(special_key).await.unwrap().unwrap();
        assert_eq!(retrieved, value);
    }

    #[tokio::test]
    async fn test_very_long_key() {
        let db_state = setup_test_db().await;

        let long_key = "a".repeat(1000);
        let value = json!({"long_key_test": true});

        db_state.set_setting(&long_key, &value).await.unwrap();
        let retrieved: Value = db_state.get_setting(&long_key).await.unwrap().unwrap();
        assert_eq!(retrieved, value);
    }

    #[tokio::test]
    async fn test_null_values() {
        let db_state = setup_test_db().await;

        let config = json!({
            "null_value": null,
            "nested": {
                "also_null": null,
                "not_null": "value"
            }
        });

        db_state.set_setting("null_test", &config).await.unwrap();
        let retrieved: Value = db_state.get_setting("null_test").await.unwrap().unwrap();

        assert_eq!(retrieved, config);
        assert!(retrieved["null_value"].is_null());
        assert!(retrieved["nested"]["also_null"].is_null());
        assert_eq!(retrieved["nested"]["not_null"], "value");
    }

    #[tokio::test]
    async fn test_deeply_nested_structure() {
        let db_state = setup_test_db().await;

        // Créer une structure très imbriquée
        let mut deep_config = json!({});
        let mut current = &mut deep_config;

        for i in 0..20 {
            current[format!("level_{}", i)] = json!({});
            current = &mut current[format!("level_{}", i)];
        }
        current["final_value"] = json!("deeply nested");

        db_state
            .set_setting("deep_config", &deep_config)
            .await
            .unwrap();

        // Construire le chemin d'accès
        let path_parts: Vec<String> = (0..20).map(|i| format!("level_{}", i)).collect();
        let path = format!("{}.final_value", path_parts.join("."));

        let final_value: String = db_state
            .get_nested_setting("deep_config", &path)
            .await
            .unwrap();
        assert_eq!(final_value, "deeply nested");
    }
}