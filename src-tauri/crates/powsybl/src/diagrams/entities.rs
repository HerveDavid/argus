use super::errors::SubscriptionError;
use super::errors::SubscriptionResult;
use crate::entities::TelemetryCurves;

use log::{debug, error, info, trace};
use tauri::ipc::Channel;
use tokio::sync::broadcast;
use zeromq::{Socket, SocketRecv};

#[derive(Debug, Clone)]
pub struct ZmqConfig {
    pub url: String,
}

impl Default for ZmqConfig {
    fn default() -> Self {
        Self {
            url: "tcp://127.0.0.1:5556".to_string(),
        }
    }
}

pub struct ZmqSubscription {
    feeder_id: String,
    config: ZmqConfig,
    channel: Channel<TelemetryCurves>,
}

impl ZmqSubscription {
    pub fn new(feeder_id: String, config: ZmqConfig, channel: Channel<TelemetryCurves>) -> Self {
        Self {
            feeder_id,
            config,
            channel,
        }
    }

    pub async fn start(&self, mut shutdown_rx: broadcast::Receiver<()>) -> SubscriptionResult<()> {
        info!(
            "Starting ZMQ monitoring for feeder {} on {}",
            self.feeder_id, self.config.url
        );
        
        let mut socket = self.create_and_connect_socket().await?;

        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    info!("Shutdown signal received for feeder {}", self.feeder_id);
                    break;
                }
                result = socket.recv() => {
                    match result {
                        Ok(message) => {
                            self.process_message(message).await?;
                        }
                        Err(e) => {
                            error!("ZMQ receive error: {:?}", e);
                            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                        }
                    }
                }
            }
        }
        info!("ZMQ monitoring finished for feeder {}", self.feeder_id);
        Ok(())
    }

    async fn create_and_connect_socket(&self) -> SubscriptionResult<zeromq::SubSocket> {
        let mut socket = zeromq::SubSocket::new();
        socket.connect(&self.config.url).await?;
        socket.subscribe("").await?;
        Ok(socket)
    }

    async fn process_message(&self, message: zeromq::ZmqMessage) -> SubscriptionResult<()> {
        debug!("ZMQ message received for feeder {}", self.feeder_id);

        if let Some(frame) = message.get(0) {
            let data = String::from_utf8(frame.to_vec())
                .unwrap_or_else(|_| String::from("[non-UTF8 data]"));

            trace!("  JSON data size: {} characters", data.len());

            let telemetry: TelemetryCurves = serde_json::from_str(&data)?;
            debug!("  Successfully deserialized to TelemetryCurves");
            debug!("  Number of curves: {}", telemetry.curves.values.len());

            self.channel
                .send(telemetry.clone())
                .map_err(|e| SubscriptionError::ChannelSendError(e.to_string()))?;

            debug!("  Data successfully sent via channel");
        }

        Ok(())
    }
}
