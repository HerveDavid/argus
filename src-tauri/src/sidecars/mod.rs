pub mod commands;

use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use log::{info, error, debug, warn};

// Helper function to spawn the sidecar and monitor its stdout/stderr
pub fn spawn_and_monitor_sidecar(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Check if a sidecar process already exists
    if let Some(state) = app_handle.try_state::<Arc<Mutex<Option<CommandChild>>>>() {
        let child_process = state.lock().unwrap();
        if child_process.is_some() {
            // A sidecar is already running, do not spawn a new one
            info!("[tauri] Sidecar is already running. Skipping spawn.");
            return Ok(()); // Exit early since sidecar is already running
        }
    }
    // Spawn sidecar
    let sidecar_command = app_handle
        .shell()
        .sidecar("powsybl")
        .map_err(|e| e.to_string())?;
    let (mut rx, child) = sidecar_command.spawn().map_err(|e| e.to_string())?;
    // Store the child process in the app state
    if let Some(state) = app_handle.try_state::<Arc<Mutex<Option<CommandChild>>>>() {
        *state.lock().unwrap() = Some(child);
    } else {
        return Err("Failed to access app state".to_string());
    }

    // Spawn an async task to handle sidecar communication
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    debug!("Sidecar stdout: {}", line);
                    // Emit the line to the frontend
                    app_handle
                        .emit("sidecar-stdout", line.to_string())
                        .expect("Failed to emit sidecar stdout event");
                }
                CommandEvent::Stderr(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    warn!("Sidecar stderr: {}", line);
                    // Emit the error line to the frontend
                    app_handle
                        .emit("sidecar-stderr", line.to_string())
                        .expect("Failed to emit sidecar stderr event");
                }
                CommandEvent::Error(error) => {
                    error!("Sidecar error: {}", error);
                    app_handle
                        .emit("sidecar-error", error.to_string())
                        .expect("Failed to emit sidecar error event");
                }
                CommandEvent::Terminated(payload) => {
                    info!("Sidecar terminated: {:?}", payload);
                    app_handle
                        .emit("sidecar-terminated", format!("{:?}", payload))
                        .expect("Failed to emit sidecar terminated event");
                }
                _ => {}
            }
        }
    });

    Ok(())
}

// Helper function ensure the sidecar is killed when the app is close
pub fn despawn_sidecar(app_handle: &tauri::AppHandle) {
    if let Some(child_process) = app_handle.try_state::<Arc<Mutex<Option<CommandChild>>>>() {
        if let Ok(mut child) = child_process.lock() {
            if let Some(process) = child.as_mut() {
                // Send msg via stdin to sidecar where it self terminates
                let command = "sidecar shutdown\n";
                let buf: &[u8] = command.as_bytes();
                let _ = process.write(buf);

                // *Important* `process.kill()` will only shutdown the parent sidecar (python process). Tauri doesnt know about the second process spawned by the "bootloader" script.
                // This only applies if you compile a "one-file" exe using PyInstaller. Otherwise, just use the line below to kill the process normally.
                // let _ = process.kill();

                info!("[tauri] Sidecar closed.");
            }
        }
    }
}