use bevy::prelude::*;
use tokio::runtime::{Handle, Runtime};

#[derive(Resource)]
pub struct AsyncRt {
    runtime: Runtime,
    pub handle: Handle,
}

impl Default for AsyncRt {
    fn default() -> Self {
        let runtime = Runtime::new().expect("Failed to create tokio runtime");
        let handle = runtime.handle().clone();

        Self { runtime, handle }
    }
}
