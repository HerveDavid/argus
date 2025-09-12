use std::collections::HashMap;
use tokio::sync::Mutex;

use crate::utils::tasks::CancellableTask;

#[derive(Default)]
pub struct TasksInner {
    pub tasks: HashMap<String, CancellableTask<()>>,
}

pub type Tasks = Mutex<TasksInner>;
