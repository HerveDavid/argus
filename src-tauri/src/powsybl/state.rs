use crate::shared::entities::iidm::{Substation, VoltageLevel};

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tauri::ipc::Channel;
use tokio::sync::{broadcast, watch};
use tokio::task::JoinHandle;
use tokio::time::interval;
use zeromq::Socket;

use super::entities::TelemetryCurves;
use super::errors::PowsyblResult;

const URL_SENDER: &str = "tcp://localhost:5555";
const URL_RECEIVER: &str = "tcp://localhost:5556";
const FPS_TARGET: f64 = 60.0;

pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

pub struct ZmqConfig {
    pub url_pub: String,
    pub url_sub: String,
}

impl ZmqConfig {
    async fn create_sub_socket(&self) -> PowsyblResult<zeromq::SubSocket> {
        let mut socket = zeromq::SubSocket::new();
        socket.connect(&self.url_sub).await?;
        socket.subscribe("").await?;

        Ok(socket)
    }
    async fn create_pub_socket(&self) -> PowsyblResult<zeromq::PubSocket> {
        let mut socket = zeromq::PubSocket::new();
        socket.connect(&self.url_pub).await?;

        Ok(socket)
    }
}

impl Default for ZmqConfig {
    fn default() -> Self {
        Self {
            url_pub: URL_SENDER.to_string(),
            url_sub: URL_RECEIVER.to_string(),
        }
    }
}

pub struct PowsyblState {
    pub config: ZmqConfig,
    // Powsybl diagrams
    pub substations: HashMap<String, Substation>,
    pub voltage_levels: HashMap<String, VoltageLevel>,
    // Process
    pub process: Option<JoinHandle<()>>,
    pub channel: Option<Arc<Channel<TelemetryCurves>>>,
    pub sender: watch::Sender<TelemetryCurves>,
    pub receiver: watch::Receiver<TelemetryCurves>,
    pub subscriptions: HashMap<String, SubscriptionHandle>,
}

impl Default for PowsyblState {
    fn default() -> Self {
        let (sender, receiver) = watch::channel(TelemetryCurves::default());
        Self {
            config: ZmqConfig::default(),
            substations: HashMap::new(),
            voltage_levels: HashMap::new(),
            process: None,
            channel: None,
            sender,
            receiver,
            subscriptions: HashMap::new(),
        }
    }
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

    pub fn start(&mut self) -> Result<(), String> {
        if let Some(channel) = &self.channel {
            let channel_clone = Arc::clone(channel);
            let receiver_clone = self.receiver.clone();
            let process = create_process(receiver_clone, channel_clone);
            self.process = Some(process);
            Ok(())
        } else {
            Err("Channel not initialized".to_string())
        }
    }

    pub fn stop(&mut self) {
        if let Some(process) = &self.process {
            process.abort();
        }
        self.process = None;
    }

    pub fn set_channel(&mut self, channel: Channel<TelemetryCurves>) {
        self.channel = Some(Arc::new(channel));
    }
}

impl Drop for PowsyblState {
    fn drop(&mut self) {
        self.stop();
    }
}

fn create_process(
    mut receiver: watch::Receiver<TelemetryCurves>,
    channel: Arc<Channel<TelemetryCurves>>,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        let mut interval_timer = interval(Duration::from_secs_f64(1.0 / FPS_TARGET));
        let mut latest_value = receiver.borrow().clone();

        loop {
            tokio::select! {
                result = receiver.changed() => {
                    if result.is_ok() {
                        latest_value = receiver.borrow_and_update().clone();
                    } else {
                        break;
                    }
                }
                _ = interval_timer.tick() => {
                    if let Err(e) = channel.send(latest_value.clone()) {
                        eprintln!("Error sending telemetry data: {:?}", e);
                        break;
                    }
                }
            }
        }
    })
}
