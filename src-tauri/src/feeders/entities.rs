use tokio::sync::broadcast;
use tokio::task::JoinHandle;

#[derive(Debug)]
pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}
