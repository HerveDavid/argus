const COMMANDS: &[&str] = &["shutdown-sidecar", "start-sidecar"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}