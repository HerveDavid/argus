// use chrono::{DateTime, Utc};
// use rand::Rng;
// use serde::{Deserialize, Serialize};
// use tauri::{ipc::Channel, State};
// use thiserror::Error;
// use tokio::time::{sleep, Duration};

// use crate::utils::tasks::{state::Tasks, CancellableTask};

// #[derive(Debug, Serialize, Error)]
// pub enum Error {}

// type Result<T> = core::result::Result<T, Error>;

// #[derive(Debug, Serialize, Deserialize)]
// pub struct Event {
//     id: String,
//     value: f64,
//     timestamp: DateTime<Utc>,
// }

// fn generate_random_float() -> f64 {
//     let mut rng = rand::thread_rng();

//     let int_value = rng.gen_range(-100000..=100000);
//     int_value as f64 / 10000.0
// }

// #[tauri::command]
// pub async fn start(state: State<'_, Tasks>, id: String, channel: Channel<Event>) -> Result<()> {
//     state.lock().await.tasks.insert(
//         id.clone(),
//         CancellableTask::new(|token| async move {
//             loop {
//                 tokio::select! {
//                     _ = sleep(Duration::from_millis(10)) => {

//                         let value = generate_random_float();

//                         let event = Event {
//                           id: id.clone(),
//                           value: value.clone(),
//                           timestamp: Utc::now(),
//                         };

//                         let _ = channel.send(event);

//                         log::info!("Send to {} - value: {}", id, value);
//                     }
//                     _ = token.cancelled() => {
//                         break;
//                     }
//                 }
//             }
//         }),
//     );

//     Ok(())
// }

// #[tauri::command]
// pub async fn stop(state: State<'_, Tasks>, id: String) -> Result<()> {
//     state.lock().await.tasks.remove(id.as_str());
//     Ok(())
// }
