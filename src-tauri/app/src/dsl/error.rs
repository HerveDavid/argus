use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    SettingsError(#[from] crate::settings::database::error::Error),

    #[error(transparent)]
    PublishError(#[from] async_nats::client::PublishError),

    #[error(transparent)]
    NatsError(#[from] crate::nats::error::Error),

    #[error("Failed to read file '{0}': {1}")]
    FileReadError(String, std::io::Error),

    #[error(transparent)]
    JsonError(#[from] serde_json::Error),

    #[error(transparent)]
    RequestError(#[from] async_nats::client::RequestError),

    #[error("Timeout waiting for response: {0}")]
    TimeoutError(String),

    #[error("Invalid response format: {0}")]
    InvalidResponseError(String),

    #[error("Operation failed: {0}")]
    OperationError(String),
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
