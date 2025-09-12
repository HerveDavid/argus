use serde::Serialize;
use thiserror::Error;

use crate::powsybl;

#[derive(Debug, Error)]
pub enum Error {
    #[error(transparent)]
    PowsyblError(#[from] powsybl::error::Error),
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
