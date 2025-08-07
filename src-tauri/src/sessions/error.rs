use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("HTTP request failed: {0}")]
    RequestFailed(#[from] reqwest::Error),

    #[error("HTTP error {status}: {message}")]
    HttpError { status: u16, message: String },

    #[error("JSON serialization failed: {0}")]
    JsonSerialization(String),

    #[error("JSON deserialization failed: {0}")]
    JsonDeserialization(String),

    #[error("Invalid URL: {0}")]
    InvalidUrl(String),

    #[error("Network timeout")]
    Timeout,

    #[error("Authentication failed")]
    AuthenticationFailed,

    #[error("Authorization failed: insufficient permissions")]
    AuthorizationFailed,

    #[error("Resource not found: {resource}")]
    NotFound { resource: String },

    #[error("Server error: {message}")]
    ServerError { message: String },

    #[error("Client error: {message}")]
    ClientError { message: String },

    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Invalid response format")]
    InvalidResponseFormat,

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Service unavailable")]
    ServiceUnavailable,
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