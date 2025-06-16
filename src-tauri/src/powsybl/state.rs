use crate::entities::iidm::{Substation, VoltageLevel};
use crate::powsybl::error::PowsyblResult;

use serde_json::Value;
use std::collections::{BTreeMap, HashMap};
use tokio::sync::broadcast;
use tokio::task::JoinHandle;
use zeromq::Socket;

const BROKER_PUB_ENDPOINT: &str = "tcp://localhost:10242";
const BROKER_SUB_ENDPOINT: &str = "tcp://localhost:10241";
const POWSYBL_REQUEST_TOPIC: &str = "powsybl.request";
const POWSYBL_RESPONSE_TOPIC: &str = "powsybl.response";

#[derive(Debug)]
pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

pub struct PowsyblState {
    pub substations: BTreeMap<String, Substation>,
    pub voltage_levels: HashMap<String, VoltageLevel>,
    pub ti_subscriptions: HashMap<String, SubscriptionHandle>,

    // TODO
    pub_socket: zeromq::PubSocket,
    sub_socket: zeromq::SubSocket,
    pending_requests: HashMap<String, tokio::sync::oneshot::Sender<Value>>,
}

impl PowsyblState {
    pub async fn new() -> PowsyblResult<tokio::sync::Mutex<Self>> {
        let substations = BTreeMap::default();
        let voltage_levels = HashMap::default();
        let ti_subscriptions = HashMap::default();

        let mut pub_socket = zeromq::PubSocket::new();
        let mut sub_socket = zeromq::SubSocket::new();
        let pending_requests = HashMap::default();

        pub_socket.connect(BROKER_PUB_ENDPOINT).await?;
        sub_socket.connect(BROKER_SUB_ENDPOINT).await?;

        sub_socket.subscribe(POWSYBL_RESPONSE_TOPIC).await?;


        Ok(tokio::sync::Mutex::new(Self {
            substations,
            voltage_levels,
            ti_subscriptions,
            pub_socket,
            sub_socket,
            pending_requests,
        }))
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
