use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskStatus {
    pub id: String,
    pub exists: bool,
    pub paused: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskActionResponse {
    pub success: bool,
    pub message: String,
    pub task_status: Option<TaskStatus>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TasksListResponse {
    pub active_tasks: Vec<TaskStatus>,
    pub total_count: usize,
}

impl TaskStatus {
    pub fn new(id: String, exists: bool, paused: Option<bool>) -> Self {
        Self { id, exists, paused }
    }

    pub fn not_found(id: String) -> Self {
        Self {
            id,
            exists: false,
            paused: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TasksStatistics {
    pub total_tasks: usize,
    pub active_tasks: usize,
    pub paused_tasks: usize,
    pub running_tasks: usize,
}
