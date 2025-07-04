use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FeederStatus {
    pub id: String,
    pub exists: bool,
    pub paused: Option<bool>,
    pub topic: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeederActionResponse {
    pub success: bool,
    pub message: String,
    pub feeder_status: Option<FeederStatus>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedersListResponse {
    pub active_feeders: Vec<FeederStatus>,
    pub total_count: usize,
}

impl FeederStatus {
    pub fn new(id: String, exists: bool, paused: Option<bool>) -> Self {
        let topic = if exists {
            Some(format!("GameMaster.{}", id.replace(".", "_")))
        } else {
            None
        };

        Self {
            id,
            exists,
            paused,
            topic,
        }
    }

    pub fn not_found(id: String) -> Self {
        Self {
            id,
            exists: false,
            paused: None,
            topic: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedersStatistics {
    pub total_feeders: usize,
    pub active_feeders: usize,
    pub paused_feeders: usize,
    pub running_feeders: usize,
}
