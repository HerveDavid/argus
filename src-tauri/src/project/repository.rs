use crate::project::config::ProjectConfig;

use super::entities::Project;
use super::error::{Error, Result};

use sqlx::{Pool, Row, Sqlite};

pub struct ProjectRepository {
    config: ProjectConfig,
    pub project: Option<Project>,
}

impl Default for ProjectRepository {
    fn default() -> Self {
        Self {
            config: ProjectConfig::default(),
            project: None,
        }
    }
}

impl ProjectRepository {
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

    pub async fn load_current_project(&mut self, pool: &Pool<Sqlite>) -> Result<Project> {
        let project = self
            .get_current_project(pool)
            .await?
            .ok_or(Error::ProjectNotFound)?;

        let project_argus_path = std::path::Path::new(&project.path).join(&self.config.dir_project);

        if !project_argus_path.exists() {
            tokio::fs::create_dir_all(&project_argus_path)
                .await
                .map_err(|e| Error::ProjectCreationFailed {
                    name: project.name.clone(),
                    source: Box::new(Error::Io(e)),
                })?;
        }

        self.project = Some(project.clone());

        Ok(project)
    }
}
