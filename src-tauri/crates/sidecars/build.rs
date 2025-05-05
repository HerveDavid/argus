const COMMANDS: &[&str] = &["start_sidecar", "shutdown_sidecar"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
