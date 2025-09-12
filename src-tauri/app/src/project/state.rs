use crate::project::repository::ProjectRepository;

use super::error::Result;
use super::manager::DatabaseManager;

use tauri::AppHandle;

pub struct ProjectState {
    pub repository: ProjectRepository,
    pub database: DatabaseManager,
}

unsafe impl Send for ProjectState {}
unsafe impl Sync for ProjectState {}

impl ProjectState {
    pub async fn new(_app_handle: &AppHandle) -> Result<tokio::sync::Mutex<Self>> {
        Ok(tokio::sync::Mutex::new(Self {
            repository: ProjectRepository::default(),
            database: DatabaseManager::new().await?,
        }))
    }
}
