use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SettingsError {
    #[error("HTTP client error: {0}")]
    HttpClient(#[from] tauri_plugin_http::reqwest::Error),

    #[error("Error accessing application state: {0}")]
    StateLock(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("File not enable to read: {0}")]
    FileRead(String),

    #[error("Deserialization error: {0}")]
    Deserialization(String),

    #[error("Invalid condig error: {0}")]
    InvalidConfig(String),
}

// Implement Serialize for SettingsError for Tauri command compatibility
impl Serialize for SettingsError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type SettingResult<T> = Result<T, SettingsError>;
