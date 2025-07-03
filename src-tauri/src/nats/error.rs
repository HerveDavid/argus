use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Error from nats connection: {0}")]
    ConnectError(#[from] async_nats::ConnectError),

    #[error("Invalid address: {0}")]
    InvalidAddress(String),

    #[error("Already connected: {0}")]
    AlreadyConnected(String),

    #[error("Not connected: {0}")]
    NotConnected(String),

    #[error("Channel error: {0}")]
    ChannelError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Timeout error: {0}")]
    TimeoutError(String),
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

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Error::SerializationError(err.to_string())
    }
}

impl From<tokio::time::error::Elapsed> for Error {
    fn from(err: tokio::time::error::Elapsed) -> Self {
        Error::TimeoutError(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
