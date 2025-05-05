use std::collections::HashMap;
use tokio::{sync::broadcast, task::JoinHandle};

pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_tx: broadcast::Sender<()>,
}

#[derive(Default)]
pub struct SldState {
    subscriptions: HashMap<String, SubscriptionHandle>,
}

impl SldState {
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
                shutdown_tx,
            },
        );
    }

    pub fn stop_task(&mut self, id: &str) -> bool {
        if let Some(task) = self.subscriptions.remove(id) {
            let _ = task.shutdown_tx.send(());
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
