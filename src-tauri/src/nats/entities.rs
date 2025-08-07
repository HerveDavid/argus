use serde::Serialize;

#[derive(Serialize)]
pub struct NatsConnectionStatus {
    pub connected: bool,
    pub address: String,
    pub active_channels: usize,
    pub channel_names: Vec<String>,
}

#[derive(Serialize)]
pub struct NatsAddressResponse {
    pub address: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct NatsConnectionResponse {
    pub success: bool,
    pub address: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct NatsDisconnectionResponse {
    pub success: bool,
    pub message: String,
    pub channels_stopped: usize,
}
