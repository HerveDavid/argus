use super::entities::{
    NatsAddressResponse, NatsConnectionResponse, NatsConnectionStatus, NatsDisconnectionResponse,
};
use super::error::{Error, Result};
use log::info;
use std::{collections::HashMap, sync::Arc};
use tokio::time::Duration;

const ADDRESS: &str = "nats://localhost:4222";
const SHUTDOWN_TIMEOUT_SECS: u64 = 5;

pub type Task = (
    tokio::task::JoinHandle<()>,
    tokio::sync::broadcast::Sender<()>,
);

pub struct NatsState {
    pub address: String,
    pub channels: HashMap<String, Task>,
    pub client: Option<Arc<async_nats::Client>>,
}

impl NatsState {
    pub async fn new() -> Result<tokio::sync::Mutex<Self>> {
        let state = tokio::sync::Mutex::new(Self {
            address: ADDRESS.to_string(),
            channels: HashMap::default(),
            client: None,
        });
        Ok(state)
    }

    pub fn set_address(&mut self, address: String) -> Result<NatsAddressResponse> {
        self.validate_address(&address)?;
        self.ensure_not_connected()?;

        self.address = address.clone();

        Ok(NatsAddressResponse {
            address: address.clone(),
            message: format!("Address set to {}", address),
        })
    }

    pub async fn connect(&mut self) -> Result<NatsConnectionResponse> {
        self.ensure_not_already_connected()?;

        match async_nats::connect(&self.address).await {
            Ok(client) => {
                let client_arc = Arc::new(client);
                self.client = Some(client_arc);

                Ok(NatsConnectionResponse {
                    success: true,
                    address: self.address.clone(),
                    message: format!("Successfully connected to {}", self.address),
                })
            }
            Err(e) => {
                self.client = None;
                Err(Error::ConnectError(e))
            }
        }
    }

    pub async fn disconnect(&mut self) -> Result<NatsDisconnectionResponse> {
        self.ensure_connected()?;

        let channel_count = self.channels.len();
        self.stop_all_channels().await;
        self.close_client();

        Ok(NatsDisconnectionResponse {
            success: true,
            message: format!(
                "Successfully disconnected from NATS server. Stopped {} active channels.",
                channel_count
            ),
            channels_stopped: channel_count,
        })
    }

    pub fn get_status(&self) -> NatsConnectionStatus {
        NatsConnectionStatus {
            connected: self.client.is_some(),
            address: self.address.clone(),
            active_channels: self.channels.len(),
            channel_names: self.channels.keys().cloned().collect(),
        }
    }

    fn validate_address(&self, address: &str) -> Result<()> {
        if address.trim().is_empty() {
            return Err(Error::InvalidAddress("Address cannot be empty".to_string()));
        }

        if !address.starts_with("nats://") && !address.starts_with("tls://") {
            return Err(Error::InvalidAddress(
                "Address must start with 'nats://' or 'tls://'".to_string(),
            ));
        }

        Ok(())
    }

    fn ensure_not_connected(&self) -> Result<()> {
        if self.client.is_some() {
            return Err(Error::AlreadyConnected(
                "Cannot change address while connected. Disconnect first.".to_string(),
            ));
        }
        Ok(())
    }

    fn ensure_not_already_connected(&self) -> Result<()> {
        if self.client.is_some() {
            return Err(Error::AlreadyConnected(
                "Already connected to NATS server".to_string(),
            ));
        }
        Ok(())
    }

    fn ensure_connected(&self) -> Result<()> {
        if self.client.is_none() {
            return Err(Error::NotConnected(
                "Not connected to any NATS server".to_string(),
            ));
        }
        Ok(())
    }

    async fn stop_all_channels(&mut self) {
        let timeout_duration = Duration::from_secs(SHUTDOWN_TIMEOUT_SECS);

        for (channel_name, (handle, shutdown_tx)) in self.channels.drain() {
            let _ = shutdown_tx.send(());

            match tokio::time::timeout(timeout_duration, handle).await {
                Ok(_) => {
                    info!("Channel '{}' stopped successfully", channel_name);
                }
                Err(_) => {
                    log::warn!("Channel '{}' did not stop within timeout", channel_name);
                }
            }
        }
    }

    fn close_client(&mut self) {
        if let Some(client) = self.client.take() {
            drop(client);
        }
    }

    pub fn get_client(&self) -> Option<Arc<async_nats::Client>> {
        self.client.clone()
    }

    pub fn is_connected(&self) -> bool {
        self.client.is_some()
    }
}
