use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Error from NATS connection: {0}")]
    ConnectionError(#[from] async_nats::ConnectError),

    #[error("NATS subscription error: {0}")]
    SubscriptionError(#[from] async_nats::SubscribeError),

    #[error("NATS client not initialized")]
    ClientNotInitialized,

    #[error("Task join error: {0}")]
    TaskJoinError(#[from] tokio::task::JoinError),

    #[error("Feeder '{0}' not found")]
    FeederNotFound(String),

    #[error("Feeder '{0}' already exists")]
    FeederAlreadyExists(String),

    #[error("Task cancellation error: {0}")]
    CancellationError(String),

    #[error("Lock acquisition failed")]
    LockError,

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Invalid topic name: {0}")]
    InvalidTopic(String),

    #[error(transparent)]
    FeederError(#[from] crate::tasks::error::Error),

    #[error(transparent)]
    SessionError(#[from] crate::sessions::error::Error),

    #[error("HTTP error {status}: {message}")]
    HttpError { status: u16, message: String },

    #[error("Request error: {0}")]
    RequestError(#[from] reqwest::Error),

    #[error("JSON deserialization error: {0}")]
    JsonDeserialization(String),

    #[error("Invalid response format")]
    InvalidResponseFormat,

    #[error("Outputs are empty")]
    OutputsEmpty,
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
