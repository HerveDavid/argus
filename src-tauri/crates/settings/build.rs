const COMMANDS: &[&str] = &["set-zmq-url", "get-zmq-url"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}