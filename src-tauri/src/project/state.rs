use crate::project::repository::ProjectRepository;

use super::config::ProjectConfig;
use super::entities::Project;
use super::error::{Error, Result};
use super::manager::DatabaseManager;

use sqlx::{Pool, Sqlite};
use tauri::AppHandle;

pub struct ProjectState {
    config: ProjectConfig,
    repository: ProjectRepository,
    // database: DatabaseManager,
    project: Option<Project>,
}

unsafe impl Send for ProjectState {}
unsafe impl Sync for ProjectState {}

impl ProjectState {
    pub async fn new(_app_handle: &AppHandle) -> Result<tokio::sync::Mutex<Self>> {
        Ok(tokio::sync::Mutex::new(Self {
            config: ProjectConfig::default(),
            repository: ProjectRepository::default(),
            // database: DatabaseManager::default(),
            project: None,
        }))
    }
    pub async fn load_project(&mut self, pool: &Pool<Sqlite>) -> Result<Project> {
        // let current_project = self
        //     .repository
        //     .get_current_project(pool)
        //     .await?
        //     .ok_or(Error::ProjectNotFound)?;

        // let project_path = std::path::PathBuf::from(&current_project.path);
        // self.validate_project_path(&project_path)?;

        // self.database
        //     .connect(&project_path, &current_project.name, &self.config)
        //     .await?;
        // self.project = Some(current_project.clone());

        // Ok(current_project)
        todo!()
    }

    pub async fn clean_project(&mut self) -> Result<()> {
        // if let Some(project) = &self.project {
        //     let project_path = std::path::PathBuf::from(&project.path);
        //     let dir_project = project_path.join(&self.config.dir_project);

        //     if dir_project.exists() {
        //         std::fs::remove_dir_all(&dir_project)?;
        //     }

        //     self.database.disconnect();
        //     self.project = None;
        // }
        // Ok(())
        todo!()
    }

    // pub fn is_loaded(&self) -> bool {
    //     self.database.is_connected() && self.project.is_some()
    // }

    // pub fn get_project(&self) -> Option<&Project> {
    //     self.project.as_ref()
    // }

    // pub fn database(&self) -> &DatabaseManager {
    //     &self.database
    // }

    // fn validate_project_path(&self, project_path: &std::path::PathBuf) -> Result<()> {
    //     if !project_path.exists() {
    //         return Err(Error::ProjectPathNotFound {
    //             path: project_path.clone(),
    //         });
    //     }
    //     Ok(())
    // }
}
