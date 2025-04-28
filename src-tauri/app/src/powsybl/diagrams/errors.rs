use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SubscriptionError {
    #[error("Failed to connect to ZMQ server: {0}")]
    ZmqConnectionError(#[from] zeromq::ZmqError),

    #[error("Failed to send telemetry data: {0}")]
    ChannelSendError(String),

    #[error("Failed to parse telemetry data: {0}")]
    ParseError(#[from] serde_json::Error),

    #[error("Task already exists for feeder: {0}")]
    TaskAlreadyExists(String),

    #[error("Failed to acquire state lock")]
    StateLockError,
}

// Implement Serialize for SubscriptonError for Tauri command compatibility
impl Serialize for SubscriptionError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Convenience conversion for returning errors from Tauri commands
impl From<SubscriptionError> for String {
    fn from(err: SubscriptionError) -> Self {
        err.to_string()
    }
}

pub type SubscriptionResult<T> = Result<T, SubscriptionError>;
