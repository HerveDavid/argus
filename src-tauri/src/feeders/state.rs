use std::{collections::HashMap, time::Duration};

use crate::utils::tasks::CancellableTask;

use super::error::Result;
use tokio::task::JoinHandle;

pub struct FeedersState {
    pub subscriptions: HashMap<String, CancellableTask<()>>,
    _listening_task: Option<JoinHandle<()>>,
}

impl FeedersState {
    pub async fn new() -> Result<tokio::sync::Mutex<Self>> {
        // Wait connection is etablished
        tokio::time::sleep(Duration::from_millis(100)).await;

        let state = Self {
            subscriptions: Default::default(),
            _listening_task: None,
        };

        Ok(tokio::sync::Mutex::new(state))
    }
}
