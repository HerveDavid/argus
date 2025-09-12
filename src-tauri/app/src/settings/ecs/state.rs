use bevy::prelude::*;
use std::{sync::Arc, thread::JoinHandle};

pub struct EcsState {
    _task: JoinHandle<()>,
}

unsafe impl Send for EcsState {}
unsafe impl Sync for EcsState {}

impl EcsState {
    pub async fn new() -> Result<Arc<tokio::sync::Mutex<Self>>> {
        let task = std::thread::spawn(move || {
            let mut toto = ecs::create_app();
            toto.run();
        });

        Ok(Arc::new(tokio::sync::Mutex::new(Self { _task: task })))
    }

    pub fn update(&mut self) {}

    pub fn send<E: Event>(&mut self, event: E) {}

    pub fn spawn<B: Bundle>(&mut self, bundle: B) {}

    pub fn insert<R: Resource>(&mut self, resource: R) {}
}
