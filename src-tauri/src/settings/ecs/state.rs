use bevy::prelude::*;
use std::sync::Arc;

use super::scada::ScadaPlugin;

pub struct EcsState {
    app: App,
}

unsafe impl Send for EcsState {}
unsafe impl Sync for EcsState {}

impl EcsState {
    pub async fn new() -> Result<Arc<tokio::sync::Mutex<Self>>> {
        let mut app = App::new();
        app.add_plugins(ScadaPlugin);

        Ok(Arc::new(tokio::sync::Mutex::new(Self { app })))
    }

    pub fn update(&mut self) {
        self.app.update();
    }

    pub fn send<E: Event>(&mut self, event: E) {
        self.app.world_mut().send_event(event);
    }

    pub fn spawn<B: Bundle>(&mut self, bundle: B) {
        self.app.world_mut().spawn(bundle);
    }

    pub fn insert<R: Resource>(&mut self, resource: R) {
        self.app.world_mut().insert_resource(resource);
    }
}
