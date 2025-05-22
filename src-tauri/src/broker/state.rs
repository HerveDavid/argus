use std::{collections::HashMap, sync::Arc};

use async_nats::ConnectError;

const ADDRESS: &str = "nats://localhost:4222";

pub type Task = (
    tokio::task::JoinHandle<()>,
    tokio::sync::broadcast::Sender<()>,
);

pub struct BrokerStateInner {
    pub channels: HashMap<String, Task>,
    pub client: Arc<async_nats::Client>,
}

impl BrokerStateInner {
    pub async fn new() -> Result<Self, ConnectError> {
        log::debug!("Tentative de connexion à {}", ADDRESS);
        let client = async_nats::connect(ADDRESS).await?;
        log::info!("Connecté à NATS sur {}", ADDRESS);

        Ok(Self {
            channels: HashMap::default(),
            client: Arc::new(client),
        })
    }
}

pub type BrokerState = tokio::sync::Mutex<BrokerStateInner>;
