use super::entities::{TaskActionResponse, TaskStatus, TasksListResponse};
use super::error::{Error, Result};
use super::state::TasksState;

use crate::tasks::entities::TasksStatistics;

use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn start_task(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    id: String,
) -> Result<TaskActionResponse> {
    let mut tasks_state = tasks_state.lock().await;

    if !tasks_state.has_subscription(&id) {
        return Err(Error::TaskNotFound(id));
    }

    // The task already exists, we simply start it by resuming it
    // (since added tasks are created in paused state by default)
    match tasks_state.resume_task(&id).await {
        Ok(()) => {
            let task_status = TaskStatus::new(id.clone(), true, Some(false)); // true = exists, false = not paused
            Ok(TaskActionResponse {
                success: true,
                message: format!("Task '{}' started successfully", id),
                task_status: Some(task_status),
            })
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn close_task(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    id: String,
) -> Result<TaskActionResponse> {
    let mut tasks_state = tasks_state.lock().await;

    match tasks_state.close_task(&id).await {
        Ok(()) => Ok(TaskActionResponse {
            success: true,
            message: format!("Task '{}' closed successfully", id),
            task_status: Some(TaskStatus::not_found(id)),
        }),
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn pause_task(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    id: String,
) -> Result<TaskActionResponse> {
    let mut tasks_state = tasks_state.lock().await;

    match tasks_state.pause_task(&id).await {
        Ok(()) => {
            let task_status = TaskStatus::new(id.clone(), true, Some(true));
            Ok(TaskActionResponse {
                success: true,
                message: format!("Task '{}' paused successfully", id),
                task_status: Some(task_status),
            })
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn resume_task(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    id: String,
) -> Result<TaskActionResponse> {
    let mut tasks_state = tasks_state.lock().await;

    match tasks_state.resume_task(&id).await {
        Ok(()) => {
            let task_status = TaskStatus::new(id.clone(), true, Some(false));
            Ok(TaskActionResponse {
                success: true,
                message: format!("Task '{}' resumed successfully", id),
                task_status: Some(task_status),
            })
        }
        Err(e) => Err(e),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_task_status(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
    id: String,
) -> Result<TaskStatus> {
    let tasks_state = tasks_state.lock().await;

    match tasks_state.is_task_paused(&id) {
        Some(is_paused) => Ok(TaskStatus::new(id, true, Some(is_paused))),
        None => Ok(TaskStatus::not_found(id)),
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn list_active_tasks(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
) -> Result<TasksListResponse> {
    let tasks_state = tasks_state.lock().await;

    let tasks_status = tasks_state.get_tasks_status();
    let active_tasks: Vec<TaskStatus> = tasks_status
        .into_iter()
        .map(|(id, is_paused)| TaskStatus::new(id, true, Some(is_paused)))
        .collect();

    let total_count = active_tasks.len();

    Ok(TasksListResponse {
        active_tasks,
        total_count,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_task_count(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
) -> Result<usize> {
    let tasks_state = tasks_state.lock().await;
    Ok(tasks_state.task_count())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_tasks_statistics(
    tasks_state: State<'_, tokio::sync::Mutex<TasksState>>,
) -> Result<TasksStatistics> {
    let tasks_state = tasks_state.lock().await;

    let tasks_status = tasks_state.get_tasks_status();
    let total_tasks = tasks_status.len();
    let paused_tasks = tasks_status
        .values()
        .filter(|&&is_paused| is_paused)
        .count();
    let running_tasks = total_tasks - paused_tasks;

    Ok(TasksStatistics {
        total_tasks,
        active_tasks: total_tasks,
        paused_tasks,
        running_tasks,
    })
}
