use log::{debug, error, info, warn};
use std::{collections::HashMap, sync::Arc};
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

use super::error::{Error, Result};

pub struct SidecarsState {
    app_handle: Arc<AppHandle>,
    sidecars: HashMap<String, CommandChild>,
}

impl SidecarsState {
    pub async fn new(
        app_handle: &AppHandle,
        default_sidecars: &[&str],
    ) -> Result<tokio::sync::Mutex<Self>> {
        let app_handle = Arc::new(app_handle.clone());
        let sidecars = HashMap::default();
        let mut state = Self {
            app_handle,
            sidecars,
        };

        // Spawn defaults
        if !default_sidecars.is_empty() {
            println!("Setup default sidecars:");
        }
        for sidecar in default_sidecars {
            state.spawn_sidecar(sidecar)?;
            println!("\t - sidecar '{}' is successfully launched", sidecar);
        }

        Ok(tokio::sync::Mutex::new(state))
    }

    pub fn spawn_sidecar(&mut self, sidecar: &str) -> Result<()> {
        if self.sidecars.contains_key(sidecar) {
            info!(
                "[tauri] Sidecar {} is already running. Skipping spawn.",
                sidecar
            );
            return Err(Error::SidecarAlreadyStarted(sidecar.to_string()));
        }

        // Insert sidecar
        let sidecar_command = self.app_handle.shell().sidecar(sidecar)?;
        let (mut rx, child) = sidecar_command.spawn()?;
        self.sidecars.insert(sidecar.to_string(), child);

        // Monitor sidecar
        let app_handle = self.app_handle.clone();
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stdout(line_bytes) => {
                        let line = String::from_utf8_lossy(&line_bytes);
                        debug!("Sidecar stdout: {}", line);
                        app_handle
                            .emit("sidecar-stdout", line.to_string())
                            .expect("Failed to emit sidecar stdout event");
                    }
                    CommandEvent::Stderr(line_bytes) => {
                        let line = String::from_utf8_lossy(&line_bytes);
                        warn!("Sidecar stderr: {}", line);
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

    pub fn despawn_sidecar(&mut self, sidecar: &str) -> Result<()> {
        let mut child = self
            .sidecars
            .remove(sidecar)
            .ok_or(Error::SidecarNotFound(sidecar.to_string()))?;

        // Send msg via stdin to sidecar where it self terminates
        let command = "sidecar shutdown\n";
        let buf: &[u8] = command.as_bytes();
        child.write(buf)?;

        // *Important* `process.kill()` will only shutdown the parent sidecar (python process). Tauri doesnt know about the second process spawned by the "bootloader" script.
        // This only applies if you compile a "one-file" exe using PyInstaller. Otherwise, just use the line below to kill the process normally.
        // let _ = process.kill();

        Ok(())
    }
}

impl Drop for SidecarsState {
    fn drop(&mut self) {
        let keys: Vec<String> = self.sidecars.keys().cloned().collect();
        for sidecar in keys {
            let _ = self.despawn_sidecar(&sidecar);
        }
    }
}
