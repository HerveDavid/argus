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
