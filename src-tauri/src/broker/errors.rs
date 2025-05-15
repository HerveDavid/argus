use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BrokerError {
    #[error("Lock error")]
    LockError(String),

    #[error("Nats connect error: {0}")]
    NatsConnectError(#[from] async_nats::ConnectError),

    #[error("Nats subssribe error: {0}")]
    NatsSubscribeError(#[from] async_nats::SubscribeError),
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
