use super::entities::CurveData;
use super::errors::{Result, SldError};
use super::state::SldState;

use log::{debug, error, info, trace};
use tokio::sync::{broadcast, watch};
use zeromq::{Socket, SocketRecv};

pub async fn create_subscription(state: &SldState, id: String) -> Result<()> {
    let url = {
        let state = state.try_read().map_err(|_| SldError::LockError)?;
        state.config.url_receiver.clone()
    };
    let id_clone = id.clone();

    state
        .try_write()
        .map_err(|_| SldError::LockError)?
        .spawn_task(id, |sender, shutdown_rx| {
            tauri::async_runtime::spawn(async move {
                info!(
                    "Starting ZMQ monitoring for feeder {} on {}",
                    id_clone.clone(),
                    url
                );

                if let Err(e) =
                    handle_subscription(url.as_str(), id_clone.as_str(), sender, shutdown_rx).await
                {
                    error!(
                        "Subscription error for feeder {}: {:?}",
                        id_clone.clone(),
                        e
                    );
                }
            })
        });

    Ok(())
}

async fn handle_subscription(
    url: &str,
    id: &str,
    sender: watch::Sender<CurveData>,
    mut shutdown_rx: broadcast::Receiver<()>,
) -> Result<()> {
    let mut socket = create_sub_socket(url).await?;
    loop {
        tokio::select! {
            _ = shutdown_rx.recv() => {
                info!("Shutdown signal received for feeder {}", id);
                break;
            }
            result = socket.recv() => {
                match result {
                    Ok(message) => {
                         handle_message(message, &sender).await?
                    },
                    Err(e) => {
                        error!("ZMQ receive error: {:?}", e);
                        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                    },
                }
            }
        }
    }
    Ok(())
}

async fn create_sub_socket(url: &str) -> Result<zeromq::SubSocket> {
    let mut socket = zeromq::SubSocket::new();
    socket.connect(url).await?;
    socket.subscribe("").await?;

    Ok(socket)
}

// async fn create_pub_socket(url: &str) -> Result<zeromq::PubSocket> {
//     let mut socket = zeromq::PubSocket::new();
//     socket.connect(url).await?;

//     Ok(socket)
// }

async fn handle_message(
    message: zeromq::ZmqMessage,
    sender: &watch::Sender<CurveData>,
) -> Result<()> {
    if let Some(frame) = message.get(0) {
        let data =
            String::from_utf8(frame.to_vec()).unwrap_or_else(|_| String::from("[non-UTF8 data]"));

        trace!("  JSON data size: {} characters", data.len());

        let telemetry: CurveData = serde_json::from_str(&data)?;
        debug!("  Successfully deserialized to TelemetryCurves");
        debug!("  Number of curves: {}", telemetry.curves.values.len());

        sender
            .send(telemetry)
            .map_err(|e| SldError::ChannelSendError(e.to_string()))?;

        debug!("  Data successfully sent via channel");
    }

    Ok(())
}
