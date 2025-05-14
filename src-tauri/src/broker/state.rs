use std::collections::HashMap;

#[derive(Default)]
pub struct BrokerState {
    pub channels: HashMap<String, tokio::task::JoinHandle<()>>,
}
