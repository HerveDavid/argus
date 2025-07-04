use serde::Serialize;
use std::path::PathBuf;
use thiserror::Error;

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

    #[error("Lock error")]
    LockError,

    #[error("JSON parse error: {0}")]
    JsonParseError(String),

    #[error("ZMQ error: {0}")]
    ZmqError(#[from] zeromq::ZmqError),

    #[error("JSON parse error at {path}: {message}")]
    SerdeJsonDetailedError {
        message: String,
        path: String,
        line: Option<usize>,
        column: Option<usize>,
    },

    #[error("UTF-8 error: {0}")]
    Utf8Error(#[from] std::str::Utf8Error),

    #[error("Base64 decode error: {0}")]
    Base64Error(#[from] base64::DecodeError),

    #[error("UUID error: {0}")]
    UuidError(#[from] uuid::Error),

    #[error("API error: {0}")]
    ApiError(String),
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
