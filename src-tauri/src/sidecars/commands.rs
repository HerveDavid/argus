use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_shell::process::CommandChild;
use super::spawn_and_monitor_sidecar;
use log::{info, error, warn};

// Define a command to shutdown sidecar process
#[tauri::command]
pub fn shutdown_sidecar(app_handle: tauri::AppHandle) -> Result<String, String> {
    info!("[tauri] Received command to shutdown sidecar.");
    
    // Access the sidecar process state
    if let Some(state) = app_handle.try_state::<Arc<Mutex<Option<CommandChild>>>>() {
        let mut child_process = state
            .lock()
            .map_err(|_| "[tauri] Failed to acquire lock on sidecar process.")?;
            
        if let Some(mut process) = child_process.take() {
            let command = "sidecar shutdown\n"; // Add newline to signal the end of the command
            
            // Attempt to write the command to the sidecar's stdin
            if let Err(err) = process.write(command.as_bytes()) {
                error!("[tauri] Failed to write to sidecar stdin: {}", err);
                // Restore the process reference if shutdown fails
                *child_process = Some(process);
                return Err(format!("Failed to write to sidecar stdin: {}", err));
            }
            
            info!("[tauri] Sent 'sidecar shutdown' command to sidecar.");
            Ok("'sidecar shutdown' command sent.".to_string())
        } else {
            warn!("[tauri] No active sidecar process to shutdown.");
            Err("No active sidecar process to shutdown.".to_string())
        }
    } else {
        Err("Sidecar process state not found.".to_string())
    }
}

// Define a command to start sidecar process.
#[tauri::command]
pub fn start_sidecar(app_handle: tauri::AppHandle) -> Result<String, String> {
    info!("[tauri] Received command to start sidecar.");
    
    spawn_and_monitor_sidecar(app_handle)?;
    
    Ok("Sidecar spawned and monitoring started.".to_string())
}