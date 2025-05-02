use super::errors::SubscriptionResult;
use crate::{errors::SubscriptionError, powsybl::entities::TelemetryCurves};
use log::{debug, error, info, trace};
use tauri::ipc::Channel;
use tokio::sync::broadcast;
use tokio::time::{Duration, Instant, interval};
use std::sync::Arc;
use tokio::sync::Mutex;
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
            "Starting ZMQ monitoring for feeder {} on {} at 60fps",
            self.feeder_id, self.config.url
        );
        
        let mut socket = self.create_and_connect_socket().await?;
        
        // Frame duration for 60fps
        let frame_duration = Duration::from_micros(1_000_000 / 60);
        let mut frame_interval = interval(frame_duration);
        
        // Store the latest telemetry data
        let latest_telemetry = Arc::new(Mutex::new(None::<TelemetryCurves>));
        let sender_telemetry = latest_telemetry.clone();
        
        // Spawn a separate task to send data at 60fps
        let channel = self.channel.clone();
        let feeder_id = self.feeder_id.clone();
        
        let send_task = tokio::spawn(async move {
            loop {
                frame_interval.tick().await;
                
                // Send the latest data if available
                let mut telemetry_guard = sender_telemetry.lock().await;
                if let Some(telemetry) = telemetry_guard.take() {
                    debug!("Sending data at 60fps for feeder {}", feeder_id);
                    if let Err(e) = channel.send(telemetry) {
                        error!("Failed to send data through channel: {}", e);
                    }
                }
            }
        });
        
        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    info!("Shutdown signal received for feeder {}", self.feeder_id);
                    break;
                }
                result = socket.recv() => {
                    match result {
                        Ok(message) => {
                            if let Some(telemetry) = self.process_message(message).await? {
                                // Update the latest telemetry data
                                let mut telemetry_guard = latest_telemetry.lock().await;
                                *telemetry_guard = Some(telemetry);
                            }
                        }
                        Err(e) => {
                            error!("ZMQ receive error: {:?}", e);
                            tokio::time::sleep(Duration::from_millis(500)).await;
                        }
                    }
                }
            }
        }
        
        // Abort the send task when shutting down
        send_task.abort();
        
        info!("ZMQ monitoring finished for feeder {}", self.feeder_id);
        Ok(())
    }

    async fn create_and_connect_socket(&self) -> SubscriptionResult<zeromq::SubSocket> {
        let mut socket = zeromq::SubSocket::new();
        socket.connect(&self.config.url).await?;
        socket.subscribe("").await?;
        Ok(socket)
    }

    async fn process_message(&self, message: zeromq::ZmqMessage) -> SubscriptionResult<Option<TelemetryCurves>> {
        debug!("ZMQ message received for feeder {}", self.feeder_id);
        
        if let Some(frame) = message.get(0) {
            let data = String::from_utf8(frame.to_vec())
                .unwrap_or_else(|_| String::from("[non-UTF8 data]"));
            
            trace!("  JSON data size: {} characters", data.len());
            
            let telemetry: TelemetryCurves = serde_json::from_str(&data)?;
            
            debug!("  Successfully deserialized to TelemetryCurves");
            debug!("  Number of curves: {}", telemetry.curves.values.len());
            
            return Ok(Some(telemetry));
        }
        
        Ok(None)
    }
}