use super::entities::Project;
use super::error::Result;

use duckdb::Connection;
use sqlx::{Pool, Row, Sqlite};
use std::path::{Path, PathBuf};
use tauri::AppHandle;

const KEY_CURRENT_PROJECT: &str = "current-project";
const ARGUS_DIR: &str = ".argus";

pub struct ProjectState {
    conn: Option<std::sync::Mutex<Connection>>,
    project: Option<Project>,
}

unsafe impl Send for ProjectState {}
unsafe impl Sync for ProjectState {}

impl ProjectState {
    pub async fn new(_app_handle: &AppHandle) -> Result<tokio::sync::Mutex<Self>> {
        Ok(tokio::sync::Mutex::new(Self {
            conn: None,
            project: None,
        }))
    }

    pub async fn load_settings(&mut self, pool: &Pool<Sqlite>) -> Result<()> {
        let current_project = self.get_current_project(pool).await?;

        if let Some(project) = current_project {
            let project_path = PathBuf::from(&project.path);
            let argus_dir = project_path.join(ARGUS_DIR);
            let db_file = argus_dir.join(format!("{}.duckdb", project.name));

            if !db_file.exists() {
                self.create_project(&project_path, &project.name).await?;
            } else {
                let conn = Connection::open(&db_file)?;
                self.conn = Some(std::sync::Mutex::new(conn));
            }

            self.project = Some(project);
        }

        Ok(())
    }

    pub fn with_connection<T, F>(&self, f: F) -> Option<T>
    where
        F: FnOnce(&Connection) -> T,
    {
        self.conn.as_ref().and_then(|mutex_conn| {
            mutex_conn.lock().ok().map(|conn| f(&*conn))
        })
    }

    pub fn is_loaded(&self) -> bool {
        self.conn.is_some() && self.project.is_some()
    }

    pub fn get_project(&self) -> Option<&Project> {
        self.project.as_ref()
    }

    async fn create_project(&mut self, path: &Path, name: &str) -> Result<()> {
        let argus_dir = path.join(ARGUS_DIR);

        if !argus_dir.exists() {
            std::fs::create_dir_all(&argus_dir)?;
        }

        let db_path = argus_dir.join(format!("{}.duckdb", name));
        let conn = Connection::open(&db_path)?;

        self.conn = Some(std::sync::Mutex::new(conn));
        Ok(())
    }

    async fn get_current_project(&self, pool: &Pool<Sqlite>) -> Result<Option<Project>> {
        let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
            .bind(KEY_CURRENT_PROJECT)
            .fetch_optional(pool)
            .await?;

        if let Some(row) = row {
            let json_value: String = row.try_get("value")?;
            let project: Project = serde_json::from_str(&json_value)?;
            Ok(Some(project))
        } else {
            Ok(None)
        }
    }
}

impl Drop for ProjectState {
    fn drop(&mut self) {
        if let Some(conn_mutex) = self.conn.take() {
            // La connexion sera automatiquement fermée quand le Mutex sera droppé
            drop(conn_mutex);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use sqlx::{Pool, Sqlite, SqlitePool};
    use std::fs;
    use tempfile::TempDir;
    use tokio;

    fn create_test_project(name: &str, path: &str) -> Project {
        Project {
            name: name.to_string(),
            path: path.to_string(),
            last_accessed: Utc::now(),
        }
    }

    async fn create_test_db() -> Pool<Sqlite> {
        let pool = SqlitePool::connect(":memory:").await.unwrap();

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value JSON NOT NULL
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        pool
    }

    async fn insert_current_project(pool: &Pool<Sqlite>, project: &Project) {
        let project_json = serde_json::to_string(project).unwrap();

        sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
            .bind(KEY_CURRENT_PROJECT)
            .bind(&project_json)
            .execute(pool)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn test_new_project_state() {
        let state = ProjectState {
            conn: None,
            project: None,
        };
        let mutex_state = tokio::sync::Mutex::new(state);

        let locked_state = mutex_state.lock().await;
        assert!(!locked_state.is_loaded());
        assert!(locked_state.get_project().is_none());
    }

    #[tokio::test]
    async fn test_get_current_project_none() {
        let pool = create_test_db().await;
        let state = ProjectState {
            conn: None,
            project: None,
        };

        let result = state.get_current_project(&pool).await.unwrap();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_get_current_project_exists() {
        let pool = create_test_db().await;
        let test_project = create_test_project("test_project", "/tmp/test");

        insert_current_project(&pool, &test_project).await;

        let state = ProjectState {
            conn: None,
            project: None,
        };

        let result = state.get_current_project(&pool).await.unwrap();
        assert!(result.is_some());

        let retrieved_project = result.unwrap();
        assert_eq!(retrieved_project.name, "test_project");
        assert_eq!(retrieved_project.path, "/tmp/test");
    }

    #[tokio::test]
    async fn test_create_project() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path();
        let project_name = "test_db";

        let mut state = ProjectState {
            conn: None,
            project: None,
        };

        state
            .create_project(project_path, project_name)
            .await
            .unwrap();

        // Vérifier que le répertoire .argus a été créé
        let argus_dir = project_path.join(ARGUS_DIR);
        assert!(argus_dir.exists());

        // Vérifier que le fichier DuckDB a été créé
        let db_file = argus_dir.join(format!("{}.duckdb", project_name));
        assert!(db_file.exists());

        // Vérifier que la connexion est établie
        assert!(state.conn.is_some());
        
        // Tester l'utilisation de la connexion
        let result = state.with_connection(|_conn| true);
        assert_eq!(result, Some(true));
    }

    #[tokio::test]
    async fn test_with_connection() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path();
        let project_name = "connection_test";

        let mut state = ProjectState {
            conn: None,
            project: None,
        };

        // Pas de connexion
        let result = state.with_connection(|_| "test");
        assert!(result.is_none());

        // Avec connexion
        state
            .create_project(project_path, project_name)
            .await
            .unwrap();

        let result = state.with_connection(|_conn| {
            // Ici vous pourriez exécuter des requêtes DuckDB
            "connection works"
        });
        assert_eq!(result, Some("connection works"));
    }

    #[tokio::test]
    async fn test_load_settings_no_current_project() {
        let pool = create_test_db().await;
        let mut state = ProjectState {
            conn: None,
            project: None,
        };

        // Charger les settings sans projet courant
        state.load_settings(&pool).await.unwrap();

        // L'état ne devrait pas changer
        assert!(!state.is_loaded());
        assert!(state.get_project().is_none());
    }

    #[tokio::test]
    async fn test_load_settings_with_new_project() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path().to_str().unwrap();
        let project_name = "new_project";

        let pool = create_test_db().await;
        let test_project = create_test_project(project_name, project_path);
        insert_current_project(&pool, &test_project).await;

        let mut state = ProjectState {
            conn: None,
            project: None,
        };

        // Charger les settings avec un nouveau projet
        state.load_settings(&pool).await.unwrap();

        // Vérifier que le projet a été créé et chargé
        assert!(state.is_loaded());
        assert!(state.get_project().is_some());

        // Vérifier que les fichiers ont été créés
        let argus_dir = PathBuf::from(project_path).join(ARGUS_DIR);
        assert!(argus_dir.exists());

        let db_file = argus_dir.join(format!("{}.duckdb", project_name));
        assert!(db_file.exists());
    }

    #[tokio::test]
    async fn test_load_settings_with_existing_project() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path();
        let project_name = "existing_project";

        // Pré-créer la structure du projet
        let argus_dir = project_path.join(ARGUS_DIR);
        fs::create_dir_all(&argus_dir).unwrap();
        let db_file = argus_dir.join(format!("{}.duckdb", project_name));
        Connection::open(&db_file).unwrap(); // Créer le fichier DB

        let pool = create_test_db().await;
        let test_project = create_test_project(project_name, project_path.to_str().unwrap());
        insert_current_project(&pool, &test_project).await;

        let mut state = ProjectState {
            conn: None,
            project: None,
        };

        // Charger les settings avec un projet existant
        state.load_settings(&pool).await.unwrap();

        // Vérifier que le projet a été chargé
        assert!(state.is_loaded());
        assert!(state.get_project().is_some());
    }

    #[tokio::test]
    async fn test_drop_closes_connection() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path();
        let project_name = "drop_test";

        let mut state = ProjectState {
            conn: None,
            project: None,
        };

        // Créer une connexion
        state
            .create_project(project_path, project_name)
            .await
            .unwrap();
        assert!(state.conn.is_some());

        // Le drop devrait fermer la connexion
        drop(state);

        // Note: Difficile de tester que la connexion est fermée car
        // DuckDB ne fournit pas de méthode pour vérifier l'état de la connexion
        // Mais le test vérifie au moins que drop() ne panique pas
    }

    #[tokio::test]
    async fn test_invalid_json_in_settings() {
        let pool = create_test_db().await;

        // Insérer un JSON invalide
        sqlx::query("INSERT INTO settings (key, value) VALUES (?, ?)")
            .bind(KEY_CURRENT_PROJECT)
            .bind("invalid json")
            .execute(&pool)
            .await
            .unwrap();

        let state = ProjectState {
            conn: None,
            project: None,
        };

        // Cela devrait retourner une erreur de sérialisation
        let result = state.get_current_project(&pool).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_is_loaded_states() {
        let mut state = ProjectState {
            conn: None,
            project: None,
        };

        // État initial - pas chargé
        assert!(!state.is_loaded());

        // Avec connexion seulement - pas chargé
        let temp_dir = TempDir::new().unwrap();
        state.create_project(temp_dir.path(), "test").await.unwrap();
        // state a une connexion mais pas de projet
        state.project = None;
        assert!(!state.is_loaded());

        // Avec projet seulement - pas chargé
        state.conn = None;
        state.project = Some(create_test_project("test", "/tmp"));
        assert!(!state.is_loaded());

        // Avec les deux - chargé
        state
            .create_project(temp_dir.path(), "test2")
            .await
            .unwrap();
        state.project = Some(create_test_project(
            "test2",
            temp_dir.path().to_str().unwrap(),
        ));
        assert!(state.is_loaded());
    }
}