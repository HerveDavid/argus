use serde::Serialize;
use thiserror::Error;

use super::events::NatsEvent;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    ConnectError(#[from] async_nats::ConnectError),
    #[error(transparent)]
    SubscribeError(#[from] async_nats::SubscribeError),
    #[error(transparent)]
    SendError(#[from] tokio::sync::mpsc::error::SendError<NatsEvent>),
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
