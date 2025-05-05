use crate::errors::{Result, SldError};
use crate::state::SldState;

use tauri::ipc::Channel;
use tokio::sync::watch;
use tokio::task::JoinHandle;
use tokio::time::{Duration, interval};

pub fn create_process(mut receiver: watch::Receiver<usize>) -> JoinHandle<()> {
    tokio::spawn(async move {
        let mut interval_timer = interval(Duration::from_secs_f64(1. / 60.));
        let mut latest_value = *receiver.borrow();

        loop {
            tokio::select! {
                _ = receiver.changed() => {
                    latest_value = *receiver.borrow_and_update();
                }
                _ = interval_timer.tick() => {
                    println!("{}", latest_value);
                }
            }
        }
    })
}

pub async fn create_subscription(state: &SldState, id: String, channel: Channel<()>) -> Result<()> {
    let mut guard = state.try_write().map_err(|_| SldError::LockError)?;

    guard.spawn_task(id, |shutdown_rx| tokio::spawn(async {}));

    use tokio::sync::watch;

    let (tx, mut rx) = watch::channel("hello");

    tx.clone();

    tokio::spawn(async move {
        // Use the equivalent of a "do-while" loop so the initial value is
        // processed before awaiting the `changed()` future.
        loop {
            println!("{}! ", *rx.borrow_and_update());
            if rx.changed().await.is_err() {
                break;
            }
        }
    });

    Ok(())
}
