use ecs::tauri::events::TauriEvent;
use std::{sync::Arc, thread::JoinHandle};
use tokio::sync::mpsc::UnboundedSender;

use super::error::Result;

pub struct EcsState {
    _task: JoinHandle<()>,
    sender: UnboundedSender<TauriEvent>,
}

unsafe impl Send for EcsState {}
unsafe impl Sync for EcsState {}

impl EcsState {
    pub async fn new() -> Result<Arc<tokio::sync::Mutex<Self>>> {
        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel();

        let task = std::thread::spawn(move || {
            let mut app = ecs::create_app(receiver);
            app.run();
        });

        Ok(Arc::new(tokio::sync::Mutex::new(Self {
            _task: task,
            sender,
        })))
    }

    pub fn send(&self, event: TauriEvent) -> Result<()> {
        Ok(self.sender.send(event)?)
    }
}
