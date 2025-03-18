use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum NetworkError {
    #[error("Request failed: {0}")]
    RequestError(#[from] tauri_plugin_http::reqwest::Error),

    #[error("API returned status code: {0}")]
    ApiError(String),

    #[error("Failed to parse JSON: {0}")]
    JsonParseError(#[from] serde_json::Error),

    #[error("Failed to acquire lock on application state")]
    LockError,
}

// Implement Serialize for ProxyError for Tauri command compatibility
impl Serialize for NetworkError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type NetworkResult<T> = Result<T, NetworkError>;
