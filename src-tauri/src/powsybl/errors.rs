use base64;
use serde::Serialize;
use thiserror::Error;
use uuid;

#[derive(Debug, Error)]
pub enum PowsyblError {
    #[error("API error: {0}")]
    ApiError(String),

    #[error("Lock error")]
    LockError,

    #[error("JSON parse error: {0}")]
    JsonParseError(String),

    #[error("ZMQ error: {0}")]
    ZmqError(#[from] zeromq::ZmqError),

    #[error("Serde JSON error: {0}")]
    SerdeJsonError(#[from] serde_json::Error),

    #[error("JSON parse error at {path}: {message}")]
    SerdeJsonDetailedError {
        message: String,
        path: String,
        line: Option<usize>,
        column: Option<usize>,
    },

    #[error("UTF-8 error: {0}")]
    Utf8Error(#[from] std::str::Utf8Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Base64 decode error: {0}")]
    Base64Error(#[from] base64::DecodeError),

    #[error("UUID error: {0}")]
    UuidError(#[from] uuid::Error),

    #[error("Sqlite error error: {0}")]
    Sqlite(#[from] sqlx::Error),
}

// Implement Serialize for PowsyblError for Tauri command compatibility
impl Serialize for PowsyblError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Convenience conversion for returning errors from Tauri commands
impl From<PowsyblError> for String {
    fn from(err: PowsyblError) -> Self {
        err.to_string()
    }
}

pub type PowsyblResult<T> = Result<T, PowsyblError>;
