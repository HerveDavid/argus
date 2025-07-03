use super::error::Result;
use std::{collections::HashMap, sync::Arc};

const ADDRESS: &str = "nats://localhost:4222";

pub type Task = (
    tokio::task::JoinHandle<()>,
    tokio::sync::broadcast::Sender<()>,
);

pub struct NatsState {
    pub address: String,
    pub channels: HashMap<String, Task>,
    pub client: Option<Arc<async_nats::Client>>,
}

impl NatsState {
    pub async fn new() -> Result<tokio::sync::Mutex<Self>> {
        let state = tokio::sync::Mutex::new(Self {
            address: ADDRESS.to_string(),
            channels: HashMap::default(),
            client: None,
        });

        Ok(state)
    }
}
