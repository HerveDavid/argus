use serde::Serialize;
use thiserror::Error;
use std::path::PathBuf;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Sqlite error: {0}")]
    SqliteDatabase(#[from] sqlx::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("InvalidConfig error: {0}")]
    InvalidConfig(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("No current project found")]
    ProjectNotFound,

    #[error("Project path does not exist: {path}")]
    ProjectPathNotFound { path: PathBuf },

    #[error("Failed to create project '{name}': {source}")]
    ProjectCreationFailed { name: String, source: Box<Error> },
    
    #[error("Database connection not established for project '{name}'")]
    ConnectionNotEstablished { name: String },
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<Error> for String {
    fn from(err: Error) -> Self {
        err.to_string()
    }
}

pub type Result<T> = std::result::Result<T, Error>;