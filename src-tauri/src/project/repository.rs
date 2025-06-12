use crate::project::config::ProjectConfig;

use super::entities::Project;
use super::error::Result;

use sqlx::{Pool, Row, Sqlite};

pub struct ProjectRepository {
    config: ProjectConfig,
}

impl Default for ProjectRepository {
    fn default() -> Self {
        Self {
            config: ProjectConfig::default(),
        }
    }
}

impl ProjectRepository {
    pub fn new(config: ProjectConfig) -> Self {
        Self { config }
    }

    pub async fn get_current_project(&self, pool: &Pool<Sqlite>) -> Result<Option<Project>> {
        let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
            .bind(&self.config.key_project)
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

    pub async fn set_current_project(&self, pool: &Pool<Sqlite>, project: &Project) -> Result<()> {
        let project_json = serde_json::to_string(project)?;

        sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
            .bind(&self.config.key_project)
            .bind(&project_json)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn get_setting<T>(&self, pool: &Pool<Sqlite>, key: &str) -> Result<Option<T>>
    where
        T: serde::de::DeserializeOwned,
    {
        let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
            .bind(key)
            .fetch_optional(pool)
            .await?;

        if let Some(row) = row {
            let json_value: String = row.try_get("value")?;
            let value: T = serde_json::from_str(&json_value)?;
            Ok(Some(value))
        } else {
            Ok(None)
        }
    }

    pub async fn set_setting<T>(&self, pool: &Pool<Sqlite>, key: &str, value: &T) -> Result<()>
    where
        T: serde::Serialize,
    {
        let json_value = serde_json::to_string(value)?;

        sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
            .bind(key)
            .bind(&json_value)
            .execute(pool)
            .await?;

        Ok(())
    }
}
