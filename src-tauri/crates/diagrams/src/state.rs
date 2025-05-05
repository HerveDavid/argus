use std::collections::HashMap;
use tokio::sync::{broadcast, watch};
use tokio::task::JoinHandle;

use crate::utils::create_process;

pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

pub struct SldStateInner {
    subscriptions: HashMap<String, SubscriptionHandle>,
    sender: watch::Sender<usize>,
    process: JoinHandle<()>,
}

impl Default for SldStateInner {
    fn default() -> Self {
        let (sender, receiver) = watch::channel(0);
        let process = create_process(receiver);
        Self {
            subscriptions: Default::default(),
            sender,
            process,
        }
    }
}

impl SldStateInner {
    pub fn spawn_task<F>(&mut self, id: String, task_fn: F)
    where
        F: FnOnce(broadcast::Receiver<()>) -> JoinHandle<()>,
    {
        let (shutdown_sender, shutdown_receicer) = broadcast::channel(1);
        let handle = task_fn(shutdown_receicer);

        self.subscriptions.insert(
            id,
            SubscriptionHandle {
                handle,
                shutdown_sender,
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

pub type SldState = crossbeam::sync::ShardedLock<SldStateInner>;
