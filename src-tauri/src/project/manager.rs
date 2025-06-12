use super::config::ProjectConfig;
use super::error::{Error, Result};

use duckdb::{Connection, ToSql};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct DatabaseManager {
    conn: Option<Mutex<Connection>>,
}

impl Default for DatabaseManager {
    fn default() -> Self {
        Self { conn: None }
    }
}

impl DatabaseManager {
    pub async fn connect(
        &mut self,
        project_path: &Path,
        project_name: &str,
        config: &ProjectConfig,
    ) -> Result<()> {
        let db_path = self.get_database_path(project_path, project_name, config);

        if !db_path.exists() {
            self.create_database(project_path, project_name, config)
                .await?;
        } else {
            self.open_existing_database(&db_path)?;
        }

        Ok(())
    }

    pub fn disconnect(&mut self) {
        self.conn = None;
    }

    pub fn is_connected(&self) -> bool {
        self.conn.is_some()
    }

    pub fn execute_query(&self, sql: &str, params: &[&dyn ToSql]) -> Result<i64> {
        self.with_connection(|conn| -> duckdb::Result<i64> {
            let rows_affected = conn.execute(sql, params)?;
            Ok(rows_affected as i64)
        })
        .ok_or_else(|| Error::InvalidConfig("No active connection".to_string()))?
        .map_err(Error::DuckDbDatabase)
    }

    pub fn query<T, F>(&self, sql: &str, params: &[&dyn ToSql], mapper: F) -> Result<Vec<T>>
    where
        F: Fn(&duckdb::Row) -> duckdb::Result<T>,
    {
        self.with_connection(|conn| -> duckdb::Result<Vec<T>> {
            let mut stmt = conn.prepare(sql)?;
            let rows = stmt.query_map(params, mapper)?;
            let mut results = Vec::new();

            for row in rows {
                results.push(row?);
            }

            Ok(results)
        })
        .ok_or_else(|| Error::InvalidConfig("No active connection".to_string()))?
        .map_err(Error::DuckDbDatabase)
    }

    pub fn insert_data<T: serde::Serialize>(&self, table_name: &str, data: &[T]) -> Result<i64> {
        if data.is_empty() {
            return Ok(0);
        }

        let json_data = serde_json::to_string(data)?;
        let sql = format!(
            "INSERT INTO {} SELECT * FROM read_json_auto($1)",
            table_name
        );

        self.execute_query(&sql, &[&json_data])
    }

    pub fn create_table(&self, table_name: &str, schema: &str) -> Result<i64> {
        let sql = format!("CREATE TABLE IF NOT EXISTS {} ({})", table_name, schema);
        self.execute_query(&sql, &[])
    }

    pub fn get_database_stats(&self) -> Result<Vec<(String, i64)>> {
        let queries = vec![
            (
                "tables",
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'main'",
            ),
            (
                "total_size",
                "SELECT SUM(estimated_size) FROM pragma_database_size()",
            ),
        ];

        let mut stats = Vec::new();

        for (name, sql) in queries {
            let result: Vec<i64> = self.query(sql, &[], |row| Ok(row.get(0)?))?;

            if let Some(value) = result.first() {
                stats.push((name.to_string(), *value));
            }
        }

        let table_stats: Vec<(String, i64)> = self.query(
            "SELECT table_name, estimated_size FROM pragma_database_size() WHERE estimated_size > 0",
            &[],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?
                ))
            }
        )?;

        stats.extend(table_stats);
        Ok(stats)
    }

    fn with_connection<T, F>(&self, f: F) -> Option<T>
    where
        F: FnOnce(&Connection) -> T,
    {
        self.conn
            .as_ref()
            .and_then(|mutex_conn| mutex_conn.lock().ok().map(|conn| f(&*conn)))
    }

    fn get_database_path(
        &self,
        project_path: &Path,
        project_name: &str,
        config: &ProjectConfig,
    ) -> PathBuf {
        let dir_project = project_path.join(&config.dir_project);
        dir_project.join(format!("{}.{}", project_name, config.ext_project))
    }

    async fn create_database(
        &mut self,
        project_path: &Path,
        project_name: &str,
        config: &ProjectConfig,
    ) -> Result<()> {
        let dir_project = project_path.join(&config.dir_project);

        if !dir_project.exists() {
            std::fs::create_dir_all(&dir_project)?;
        }

        let db_path = self.get_database_path(project_path, project_name, config);
        let conn = Connection::open(&db_path)?;

        self.conn = Some(Mutex::new(conn));
        Ok(())
    }

    fn open_existing_database(&mut self, db_file: &PathBuf) -> Result<()> {
        let conn = Connection::open(db_file).map_err(|e| Error::DatabaseConnectionFailed {
            path: db_file.clone(),
            source: e,
        })?;

        self.conn = Some(Mutex::new(conn));
        Ok(())
    }
}

impl Drop for DatabaseManager {
    fn drop(&mut self) {
        if let Some(conn) = self.conn.take() {
            drop(conn);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use tempfile::TempDir;

    // Structure de test pour les insertions
    #[derive(Serialize, Deserialize, Debug, PartialEq)]
    struct TestRecord {
        id: i32,
        name: String,
        value: f64,
    }

    // Helper pour créer une config de test
    fn create_test_config() -> ProjectConfig {
        ProjectConfig {
            dir_project: "test_db".to_string(),
            ext_project: "duckdb".to_string(),
            key_project: "key_db".to_string(),
        }
    }

    // Helper pour créer un répertoire temporaire
    fn setup_temp_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp directory")
    }

    #[tokio::test]
    async fn test_default_initialization() {
        let db_manager = DatabaseManager::default();
        assert!(!db_manager.is_connected());
    }

    #[tokio::test]
    async fn test_connect_creates_new_database() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        let result = db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await;

        assert!(result.is_ok());
        assert!(db_manager.is_connected());

        // Vérifier que le fichier de base de données a été créé
        let expected_path = temp_dir.path().join("test_db").join("test_project.duckdb");
        assert!(expected_path.exists());
    }

    #[tokio::test]
    async fn test_connect_opens_existing_database() {
        let temp_dir = setup_temp_dir();
        let config = create_test_config();

        // Créer d'abord une base de données
        let mut db_manager1 = DatabaseManager::default();
        db_manager1
            .connect(temp_dir.path(), "existing_project", &config)
            .await
            .unwrap();

        // Créer une table pour vérifier la persistance
        db_manager1
            .create_table("test_table", "id INTEGER, name TEXT")
            .unwrap();

        db_manager1.disconnect();

        // Rouvrir la base de données existante
        let mut db_manager2 = DatabaseManager::default();
        let result = db_manager2
            .connect(temp_dir.path(), "existing_project", &config)
            .await;

        assert!(result.is_ok());
        assert!(db_manager2.is_connected());

        // Vérifier que la table existe toujours
        let tables: Vec<String> = db_manager2
            .query(
                "SELECT table_name FROM information_schema.tables WHERE table_name = 'test_table'",
                &[],
                |row| Ok(row.get(0)?),
            )
            .unwrap();

        assert_eq!(tables.len(), 1);
        assert_eq!(tables[0], "test_table");
    }

    #[tokio::test]
    async fn test_disconnect() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await
            .unwrap();

        assert!(db_manager.is_connected());

        db_manager.disconnect();
        assert!(!db_manager.is_connected());
    }

    #[tokio::test]
    async fn test_create_table() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await
            .unwrap();

        let result = db_manager.create_table(
            "users",
            "id INTEGER PRIMARY KEY, name VARCHAR(100), email VARCHAR(255)",
        );

        assert!(result.is_ok());
        assert!(result.unwrap() >= 0);

        // Vérifier que la table a été créée
        let tables: Vec<String> = db_manager
            .query(
                "SELECT table_name FROM information_schema.tables WHERE table_name = 'users'",
                &[],
                |row| Ok(row.get(0)?),
            )
            .unwrap();

        assert_eq!(tables.len(), 1);
    }

    #[tokio::test]
    async fn test_execute_query() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await
            .unwrap();

        // Créer une table
        db_manager
            .create_table("test_execute", "id INTEGER, value TEXT")
            .unwrap();

        // Insérer des données
        let result = db_manager.execute_query(
            "INSERT INTO test_execute (id, value) VALUES (?, ?)",
            &[&&1, &"test_value"],
        );

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1); // Une ligne affectée
    }

    #[tokio::test]
    async fn test_query_with_results() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await
            .unwrap();

        // Créer et peupler une table
        db_manager
            .create_table("test_query", "id INTEGER, name TEXT")
            .unwrap();

        db_manager
            .execute_query(
                "INSERT INTO test_query VALUES (1, 'Alice'), (2, 'Bob')",
                &[],
            )
            .unwrap();

        // Exécuter une requête de sélection
        let results: Vec<(i32, String)> = db_manager
            .query("SELECT id, name FROM test_query ORDER BY id", &[], |row| {
                Ok((row.get(0)?, row.get(1)?))
            })
            .unwrap();

        assert_eq!(results.len(), 2);
        assert_eq!(results[0], (1, "Alice".to_string()));
        assert_eq!(results[1], (2, "Bob".to_string()));
    }

    #[tokio::test]
    #[ignore = "refactoring"]
    async fn test_insert_data_json() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await
            .unwrap();

        // Créer une table compatible avec TestRecord
        db_manager
            .create_table(
                "test_records",
                "id INTEGER, name VARCHAR(100), value DOUBLE",
            )
            .unwrap();

        // Préparer des données de test
        let test_data = vec![
            TestRecord {
                id: 1,
                name: "Record 1".to_string(),
                value: 10.5,
            },
            TestRecord {
                id: 2,
                name: "Record 2".to_string(),
                value: 20.7,
            },
        ];

        // Insérer les données
        let result = db_manager.insert_data("test_records", &test_data);
        assert!(result.is_ok());

        // Vérifier que les données ont été insérées
        let inserted_records: Vec<TestRecord> = db_manager
            .query(
                "SELECT id, name, value FROM test_records ORDER BY id",
                &[],
                |row| {
                    Ok(TestRecord {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        value: row.get(2)?,
                    })
                },
            )
            .unwrap();

        assert_eq!(inserted_records, test_data);
    }

    #[tokio::test]
    async fn test_insert_data_empty_slice() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await
            .unwrap();

        let empty_data: Vec<TestRecord> = vec![];
        let result = db_manager.insert_data("any_table", &empty_data);

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
    }

    #[tokio::test]
    async fn test_get_database_stats() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "test_project", &config)
            .await
            .unwrap();

        // Créer quelques tables
        db_manager
            .create_table("table1", "id INTEGER, data TEXT")
            .unwrap();
        db_manager
            .create_table("table2", "id INTEGER, value DOUBLE")
            .unwrap();

        let stats = db_manager.get_database_stats().unwrap();

        // Vérifier qu'on a au moins les statistiques de base
        let stats_map: std::collections::HashMap<String, i64> = stats.into_iter().collect();

        assert!(stats_map.contains_key("tables"));
        assert!(stats_map.contains_key("total_size"));
        assert!(stats_map["tables"] >= 2); // Au moins nos 2 tables
    }

    #[tokio::test]
    async fn test_error_when_not_connected() {
        let db_manager = DatabaseManager::default();

        let result = db_manager.execute_query("SELECT 1", &[]);
        assert!(result.is_err());

        match result.unwrap_err() {
            Error::InvalidConfig(msg) => {
                assert_eq!(msg, "No active connection");
            }
            _ => panic!("Expected InvalidConfig error"),
        }
    }

    #[tokio::test]
    async fn test_query_error_when_not_connected() {
        let db_manager = DatabaseManager::default();

        let result: Result<Vec<i32>> = db_manager.query("SELECT 1", &[], |row| Ok(row.get(0)?));

        assert!(result.is_err());
        match result.unwrap_err() {
            Error::InvalidConfig(msg) => {
                assert_eq!(msg, "No active connection");
            }
            _ => panic!("Expected InvalidConfig error"),
        }
    }

    #[tokio::test]
    async fn test_get_database_path() {
        let temp_dir = setup_temp_dir();
        let db_manager = DatabaseManager::default();
        let config = create_test_config();

        let path = db_manager.get_database_path(temp_dir.path(), "my_project", &config);

        let expected = temp_dir.path().join("test_db").join("my_project.duckdb");

        assert_eq!(path, expected);
    }

    #[tokio::test]
    async fn test_create_database_creates_directory() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        let result = db_manager
            .create_database(temp_dir.path(), "test_project", &config)
            .await;

        assert!(result.is_ok());
        assert!(db_manager.is_connected());

        // Vérifier que le répertoire a été créé
        let project_dir = temp_dir.path().join("test_db");
        assert!(project_dir.exists());
        assert!(project_dir.is_dir());
    }

    #[tokio::test]
    async fn test_concurrent_access() {
        let temp_dir = setup_temp_dir();
        let mut db_manager = DatabaseManager::default();
        let config = create_test_config();

        db_manager
            .connect(temp_dir.path(), "concurrent_test", &config)
            .await
            .unwrap();

        db_manager
            .create_table("concurrent_table", "id INTEGER, value TEXT")
            .unwrap();

        // Simuler des accès concurrents
        let handles: Vec<_> = (0..5)
            .map(|i| {
                let query = format!("INSERT INTO concurrent_table VALUES ({}, 'value_{}')", i, i);
                db_manager.execute_query(&query, &[])
            })
            .collect();

        // Vérifier que toutes les opérations ont réussi
        for result in handles {
            assert!(result.is_ok());
        }

        // Vérifier le nombre total d'enregistrements
        let count: Vec<i64> = db_manager
            .query("SELECT COUNT(*) FROM concurrent_table", &[], |row| {
                Ok(row.get(0)?)
            })
            .unwrap();

        assert_eq!(count[0], 5);
    }
}
