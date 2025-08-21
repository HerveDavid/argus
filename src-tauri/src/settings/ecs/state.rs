use bevy::prelude::*;
use std::sync::Arc;

pub struct EcsState {
    app: Arc<tokio::sync::Mutex<App>>,
}

impl EcsState {
    pub fn new() -> Self {
        let app = App::new();

        Self {
            app: Arc::new(tokio::sync::Mutex::new(app)),
        }
    }

    pub async fn update(&self) {
        self.app.lock().await.update();
    }
}
