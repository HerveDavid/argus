use crate::entities::{CurveData, EventsData, Feeders};

use std::collections::HashMap;
use tokio::sync::{broadcast, watch};
use tokio::task::JoinHandle;
use tokio::time::{Duration, interval};

pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

pub struct ZmqConfig {
    pub url_sender: String,
    pub url_receiver: String,
}

#[derive(Default)]
pub struct Mapping {
    pub feeders: Feeders,
    pub events: EventsData,
}

pub struct SldStateInner {
    pub subscriptions: HashMap<String, SubscriptionHandle>,
    pub sender: watch::Sender<CurveData>,
    pub process: JoinHandle<()>,
    pub config: ZmqConfig,
    pub mapping: Mapping,
}

impl Default for SldStateInner {
    fn default() -> Self {
        let (sender, receiver) = watch::channel(CurveData::default());
        let process = Self::create_process(receiver);

        let zmq_subscription = ZmqConfig {
            url_sender: "tcp://*:5555".to_string(),
            url_receiver: "tcp://*:5556".to_string(),
        };

        Self {
            subscriptions: Default::default(),
            sender,
            process,
            config: zmq_subscription,
            mapping: Default::default(),
        }
    }
}

impl Drop for SldStateInner {
    fn drop(&mut self) {
        self.process.abort();
    }
}

impl SldStateInner {
    const FPS_TARGET: f64 = 60.0;

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

    fn create_process(mut receiver: watch::Receiver<CurveData>) -> JoinHandle<()> {
        tokio::spawn(async move {
            let mut interval_timer =
                interval(Duration::from_secs_f64(1.0 / SldStateInner::FPS_TARGET));
            let mut latest_value = receiver.borrow().clone();

            loop {
                tokio::select! {
                    _ = receiver.changed() => {
                        latest_value = receiver.borrow_and_update().clone();
                    }
                    _ = interval_timer.tick() => {
                        println!("{:?}", latest_value);
                    }
                }
            }
        })
    }
}

pub type SldState = crossbeam::sync::ShardedLock<SldStateInner>;
