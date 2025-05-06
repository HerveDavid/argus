const COMMANDS: &[&str] = &[
    "subscribe_diagram",
    "unsubscribe_diagram",
    "update_feeders",
    "update_events",
    "event_open_breaker",
    "event_close_breaker",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
