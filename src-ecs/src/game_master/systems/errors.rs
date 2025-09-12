use bevy::prelude::*;

use crate::game_master::events::{ErrorEvent, ErrorSeverity};

pub fn handle_errors(mut error_events: EventReader<ErrorEvent>) {
    for error in error_events.read() {
        match error.severity {
            ErrorSeverity::Recoverable => println!("{}", error.message),
            _ => {}
        }
    }
}
