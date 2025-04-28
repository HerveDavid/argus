use std::sync::{Arc, RwLock};
use zeromq::Socket;

pub struct SettingsState {
    pub zmq_client: Arc<RwLock<zeromq::SubSocket>>,
    pub zmq_url: Arc<RwLock<Option<String>>>,
}

impl Default for SettingsState {
    fn default() -> Self {
        // Build the zeromq client
        let zmq_client = zeromq::SubSocket::new();

        Self {
            zmq_client: Arc::new(RwLock::new(zmq_client)),
            zmq_url: Arc::new(RwLock::new(Some("".to_string()))),
        }
    }
}
