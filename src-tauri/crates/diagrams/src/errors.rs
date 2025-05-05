use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SldError {
    #[error("API error: {0}")]
    ApiError(String),

    #[error("Lock error")]
    LockError,

    #[error("JSON parse error: {0}")]
    JsonParseError(String),

    #[error("Serde JSON error: {0}")]
    SerdeJsonError(#[from] serde_json::Error),

    #[error("UTF-8 error: {0}")]
    Utf8Error(#[from] std::str::Utf8Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

// Implement Serialize for SldError for Tauri command compatibility
impl Serialize for SldError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Convenience conversion for returning errors from Tauri commands
impl From<SldError> for String {
    fn from(err: SldError) -> Self {
        err.to_string()
    }
}

pub type Result<T> = std::result::Result<T, SldError>;
