use crate::entities::{CurveData, EventsData};
use crate::entry::ReferenceMapper;

use std::collections::HashMap;
use tauri::async_runtime::JoinHandle;
use tauri::ipc::Channel;
use tokio::sync::{broadcast, watch};
use tokio::time::{Duration, interval};

const URL_SENDER: &str = "tcp://localhost:5555";
const URL_RECEIVER: &str = "tcp://localhost:5556";
const FPS_TARGET: f64 = 10.0;

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
    pub process: Option<JoinHandle<()>>,
    pub config: ZmqConfig,
    pub mapping: Option<ReferenceMapper>,
    pub events: Option<EventsData>,
    pub channel: Option<Channel<CurveData>>,
}

impl Default for SldStateInner {
    fn default() -> Self {
        let (sender, _) = watch::channel(CurveData::default());

        let config = ZmqConfig {
            url_sender: URL_SENDER.to_string(),
            url_receiver: URL_RECEIVER.to_string(),
        };

        Self {
            subscriptions: Default::default(),
            sender,
            process: None,
            config,
            mapping: None,
            events: None,
            channel: None,
        }
    }
}

impl Drop for SldStateInner {
    fn drop(&mut self) {
        if self.process.is_some() {
            self.process.as_ref().unwrap().abort();
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

    pub fn start_process(&mut self) {
        if let Some(channel) = self.channel.clone() {
            let (sender, receiver) = watch::channel(CurveData::default());
            let process = Self::create_process(receiver, channel);

            self.sender = sender;
            self.process = Some(process);
        }
    }

    fn create_process(
        mut receiver: watch::Receiver<CurveData>,
        channel: Channel<CurveData>,
    ) -> JoinHandle<()> {
        tauri::async_runtime::spawn(async move {
            let mut interval_timer = interval(Duration::from_secs_f64(1.0 / FPS_TARGET));
            let mut latest_value = receiver.borrow().clone();

            loop {
                tokio::select! {
                    _ = receiver.changed() => {
                        latest_value = receiver.borrow_and_update().clone();
                    }
                    _ = interval_timer.tick() => {
                        channel.send(latest_value.clone()).unwrap();
                        println!("sended");
                    }
                }
            }
        })
    }
}

pub type SldState = crossbeam::sync::ShardedLock<SldStateInner>;
