use bevy::prelude::*;
use serde::Serialize;

#[derive(Event, Debug, Serialize)]
pub struct ErrorEvent {
    pub message: String,
    pub severity: ErrorSeverity,
}

#[derive(Debug, Serialize)]
pub enum ErrorSeverity {
    Recoverable, // Retry
    Transient,   // Retry backoff
    Permanent,   // Never retry
    Critical,    // System critical
}
