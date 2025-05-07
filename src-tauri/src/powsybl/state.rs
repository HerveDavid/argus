use crate::shared::entities::iidm::{Substation, VoltageLevel};

use std::collections::HashMap;
use tokio::sync::broadcast;
use tokio::task::JoinHandle;

const URL_SENDER: &str = "tcp://localhost:5555";
const URL_RECEIVER: &str = "tcp://localhost:5556";
const FPS_TARGET: f64 = 60.0;

#[derive(Debug)]
pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

#[derive(Debug)]
pub struct ZmqConfig {
    pub url_sender: String,
    pub url_receiver: String,
}

impl Default for ZmqConfig {
    fn default() -> Self {
        Self {
            url_sender: URL_SENDER.to_string(),
            url_receiver: URL_RECEIVER.to_string(),
        }
    }
}

struct Process {}

#[derive(Debug, Default)]
pub struct PowsyblState {
    pub config: ZmqConfig,
    pub substations: HashMap<String, Substation>,
    pub voltage_levels: HashMap<String, VoltageLevel>,
    pub subscriptions: HashMap<String, SubscriptionHandle>,
}

impl PowsyblState {
    pub fn spawn_task<F>(&mut self, id: String, task_fn: F)
    where
        F: FnOnce(broadcast::Receiver<()>) -> JoinHandle<()>,
    {
        let (shutdown_tx, shutdown_rx) = broadcast::channel(1);
        let handle = task_fn(shutdown_rx);

        self.subscriptions.insert(
            id,
            SubscriptionHandle {
                handle,
                shutdown_sender: shutdown_tx,
            },
        );
    }

    pub fn stop_task(&mut self, id: &str) -> bool {
        if let Some(task) = self.subscriptions.remove(id) {
            let _ = task.shutdown_sender.send(());
            task.handle.abort();
            true
        } else {
            false
        }
    }

    pub fn has_task(&self, id: &str) -> bool {
        self.subscriptions.contains_key(id)
    }
}
