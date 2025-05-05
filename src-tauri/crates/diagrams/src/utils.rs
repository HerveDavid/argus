use crate::state::SldState;

use tauri::ipc::Channel;

async fn create_subscription(state: &mut SldState, id: String, channel: Channel<()>) {
    state.spawn_task(id, |shutdown_rx| tokio::spawn(async {}));
}
