const COMMANDS: &[&str] = &["shutdown_sidecar", "start_sidecar"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}