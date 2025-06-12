use crate::entities::iidm::{Substation, VoltageLevel};

use std::collections::HashMap;
use tokio::sync::broadcast;
use tokio::task::JoinHandle;

#[derive(Debug)]
pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

#[derive(Debug, Default)]
pub struct PowsyblState {
    pub substations: HashMap<String, Substation>,
    pub voltage_levels: HashMap<String, VoltageLevel>,
    pub ti_subscriptions: HashMap<String, SubscriptionHandle>,
}

impl PowsyblState {
    pub fn new() -> tokio::sync::Mutex<Self> {
        tokio::sync::Mutex::new(Self::default())
    }

    pub fn spawn_task<F>(&mut self, id: String, task_fn: F)
    where
        F: FnOnce(broadcast::Receiver<()>) -> JoinHandle<()>,
    {
        let (shutdown_tx, shutdown_rx) = broadcast::channel(1);
        let handle = task_fn(shutdown_rx);

        self.ti_subscriptions.insert(
            id,
            SubscriptionHandle {
                handle,
                shutdown_sender: shutdown_tx,
            },
        );
    }

    pub fn stop_task(&mut self, id: &str) -> bool {
        if let Some(task) = self.ti_subscriptions.remove(id) {
            let _ = task.shutdown_sender.send(());
            task.handle.abort();
            true
        } else {
            false
        }
    }

    pub fn has_task(&self, id: &str) -> bool {
        self.ti_subscriptions.contains_key(id)
    }
}
