use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Failed from tauri plugin shell: {0}")]
    TauriPluginShell(#[from] tauri_plugin_shell::Error),

    #[error("Sidecar is already started: {0}")]
    SidecarAlreadyStarted(String),

    #[error("Sidecar is not found: {0}")]
    SidecarNotFound(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

impl From<Error> for String {
    fn from(err: Error) -> Self {
        err.to_string()
    }
}

pub type Result<T> = std::result::Result<T, Error>;
