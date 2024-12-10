const COMMANDS: &[&str] = &["pause", "resume", "stop"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}