use std::collections::HashMap;

pub type Task = (
    tokio::task::JoinHandle<()>,
    tokio::sync::broadcast::Sender<()>,
);

#[derive(Default)]
pub struct BrokerState {
    pub channels: HashMap<String, Task>,
}
