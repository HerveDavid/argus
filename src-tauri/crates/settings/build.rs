const COMMANDS: &[&str] = &["set_zmq_url", "get_zmq_url"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}