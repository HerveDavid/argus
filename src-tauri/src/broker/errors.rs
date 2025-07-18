use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BrokerError {
    #[error("Lock error")]
    LockError(String),

    #[error("Nats connect error: {0}")]
    NatsConnectError(#[from] async_nats::ConnectError),

    #[error("Nats subscribe error: {0}")]
    NatsSubscribeError(#[from] async_nats::SubscribeError),

    #[error("Nats publish error: {0}")]
    NatsPublishError(#[from] async_nats::PublishError),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("State error error: {0}")]
    StateError(String),

    #[error("Validation error error: {0}")]
    ValidationError(String),
}

// Implement Serialize for PowsyblError for Tauri command compatibility
impl Serialize for BrokerError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Convenience conversion for returning errors from Tauri commands
impl From<BrokerError> for String {
    fn from(err: BrokerError) -> Self {
        err.to_string()
    }
}

pub type BrokerResult<T> = Result<T, BrokerError>;
