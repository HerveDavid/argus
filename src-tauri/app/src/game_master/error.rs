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

    // NEW ERROR TYPES FOR ADDITIONAL FUNCTIONALITY:
    #[error("Simulation '{0}' not found")]
    SimulationNotFound(String),

    #[error("Simulation '{0}' already exists")]
    SimulationAlreadyExists(String),

    #[error("IIDM file '{0}' not found")]
    IidmFileNotFound(String),

    #[error("Invalid DSL content: {0}")]
    InvalidDslContent(String),

    #[error("File upload error: {0}")]
    FileUploadError(String),

    #[error("File deletion error: {0}")]
    FileDeletionError(String),

    #[error("Invalid file format: {0}")]
    InvalidFileFormat(String),

    #[error("Multiple files found for simulation '{0}' - conflict resolution required")]
    MultipleFilesConflict(String),

    #[error("Event store error: {0}")]
    EventStoreError(String),

    #[error("Queue operation error: {0}")]
    QueueError(String),

    #[error("System state update failed: {0}")]
    SystemStateUpdateError(String),

    #[error("Control command error: {0}")]
    ControlCommandError(String),

    #[error("Atomic operation error: {0}")]
    AtomicOperationError(String),

    #[error("URL encoding error: {0}")]
    UrlEncodingError(#[from] std::str::Utf8Error),

    #[error("Multipart form error: {0}")]
    MultipartFormError(String),

    #[error("Mime type error: {0}")]
    MimeTypeError(String),

    #[error("Text parsing error: {0}")]
    TextParsingError(String),
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
