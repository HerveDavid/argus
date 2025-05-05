use crate::entities::CurveData;
use crate::utils::create_process;

use std::collections::HashMap;
use tokio::sync::{broadcast, watch};
use tokio::task::JoinHandle;

pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

pub struct ZmqConfig {
    pub url_sender: String,
    pub url_receiver: String,
}

pub struct SldStateInner {
    pub subscriptions: HashMap<String, SubscriptionHandle>,
    pub sender: watch::Sender<CurveData>,
    pub process: JoinHandle<()>,
    pub config: ZmqConfig,
}

impl Default for SldStateInner {
    fn default() -> Self {
        let (sender, receiver) = watch::channel(CurveData::default());
        let process = create_process(receiver);

        let zmq_subscription = ZmqConfig {
            url_sender: "tcp://*:5555".to_string(),
            url_receiver: "tcp://*:5556".to_string(),
        };

        Self {
            subscriptions: Default::default(),
            sender,
            process,
            config: zmq_subscription,
        }
    }
}

impl SldStateInner {
    pub fn spawn_task<F>(&mut self, id: String, task_fn: F)
    where
        F: FnOnce(watch::Sender<CurveData>, broadcast::Receiver<()>) -> JoinHandle<()>,
    {
        let (shutdown_sender, shutdown_receicer) = broadcast::channel(1);
        let handle = task_fn(self.sender.clone(), shutdown_receicer);

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
