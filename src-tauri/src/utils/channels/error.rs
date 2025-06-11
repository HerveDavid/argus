use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("{0}")]
    JoinError(#[from] tokio::task::JoinError),

    #[error("Channel with id '{id}' not found")]
    ChannelNotFound { id: String },

    #[error("Channel with id '{id}' already exists")]
    ChannelAlreadyExists { id: String },

    #[error("Failed to send event to channel '{id}': {reason}")]
    ChannelSendError { id: String, reason: String },

    #[error("Channel with id '{id}' is already in the requested state")]
    InvalidStateTransition { id: String },

    #[error("Lock acquisition failed: {0}")]
    LockError(String),

    #[error("Task cancellation failed for channel '{id}'")]
    TaskCancellationError { id: String },
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

pub type Result<T> = core::result::Result<T, Error>;
