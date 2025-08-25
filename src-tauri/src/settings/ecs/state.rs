use bevy::prelude::*;

pub struct EcsState {
    app: App,
}

unsafe impl Send for EcsState {}
unsafe impl Sync for EcsState {}

impl EcsState {
    pub async fn new() -> Result<tokio::sync::Mutex<Self>> {
        let mut app = App::new();

        Ok(tokio::sync::Mutex::new(Self { app }))
    }

    pub fn update(&mut self) {
        self.app.update();
    }
}
