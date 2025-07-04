use super::error::{Error, Result};

use crate::utils::tasks::CancellableTask;

use log::{debug, info, warn};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::{collections::HashMap, time::Duration};

pub struct TasksState {
    pub subscriptions: HashMap<String, (Arc<AtomicBool>, CancellableTask<()>)>,
}

impl TasksState {
    pub async fn new() -> Result<tokio::sync::Mutex<Self>> {
        let state = Self {
            subscriptions: Default::default(),
        };

        Ok(tokio::sync::Mutex::new(state))
    }

    pub fn has_subscription(&self, id: &str) -> bool {
        self.subscriptions.contains_key(id)
    }

    pub fn add_task(&mut self, id: String, task: CancellableTask<()>) -> Result<()> {
        if self.has_subscription(&id) {
            info!("Subscription already exists for task '{}'", id);
            return Err(Error::TaskAlreadyExists(id));
        }

        let paused = Arc::new(AtomicBool::new(true));

        self.subscriptions.insert(id.clone(), (paused, task));

        info!("Task '{}' added successfully (paused by default)", id);
        Ok(())
    }

    pub async fn pause_task(&mut self, id: &str) -> Result<()> {
        match self.subscriptions.get(id) {
            Some((paused, _)) => {
                let was_running = !paused.swap(true, Ordering::Relaxed);
                if was_running {
                    info!("Paused task '{}'", id);
                    Ok(())
                } else {
                    warn!("Task '{}' was already paused", id);
                    Ok(())
                }
            }
            None => {
                warn!("Attempted to pause non-existent task '{}'", id);
                Err(Error::TaskNotFound(id.to_string()))
            }
        }
    }

    pub async fn resume_task(&mut self, id: &str) -> Result<()> {
        match self.subscriptions.get(id) {
            Some((paused, _)) => {
                let was_paused = paused.swap(false, Ordering::Relaxed);
                if was_paused {
                    info!("Resumed task '{}'", id);
                    Ok(())
                } else {
                    warn!("Task '{}' was already running", id);
                    Ok(())
                }
            }
            None => {
                warn!("Attempted to resume non-existent task '{}'", id);
                Err(Error::TaskNotFound(id.to_string()))
            }
        }
    }

    pub fn is_task_paused(&self, id: &str) -> Option<bool> {
        self.subscriptions
            .get(id)
            .map(|(paused, _)| paused.load(Ordering::Relaxed))
    }

    pub async fn close_task(&mut self, id: &str) -> Result<()> {
        if let Some((_, mut task)) = self.subscriptions.remove(id) {
            info!("Closing task subscription for '{}'", id);

            // Cancel the task
            task.cancel();

            // Wait for the task to complete with a timeout
            match tokio::time::timeout(Duration::from_secs(5), task.join()).await {
                Ok(Ok(_)) => {
                    debug!("Task task '{}' terminated successfully", id);
                }
                Ok(Err(e)) => {
                    warn!("Error while terminating task task '{}': {:?}", id, e);
                }
                Err(_) => {
                    warn!(
                        "Timeout while waiting for task task '{}' to terminate",
                        id
                    );
                }
            }

            info!("Task '{}' closed successfully", id);
        } else {
            debug!("No active subscription found for task '{}'", id);
        }

        Ok(())
    }

    pub fn task_count(&self) -> usize {
        self.subscriptions.len()
    }

    pub fn get_tasks_status(&self) -> HashMap<String, bool> {
        self.subscriptions
            .iter()
            .map(|(id, (paused, _))| (id.clone(), paused.load(Ordering::Relaxed)))
            .collect()
    }
}
