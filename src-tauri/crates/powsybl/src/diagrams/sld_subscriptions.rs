use super::entities::{ZmqConfig, ZmqSubscription};
use super::sld_metadata::SldMetadata;

use crate::entities::{SldSubscriptionResponse, TelemetryCurves};
use crate::errors::{PowsyblError, PowsyblResult};
use crate::state::PowsyblState;

use log::{debug, error, info};
use tauri::{State, ipc::Channel};

async fn create_subscription_task(
    powsybl_state: &State<'_, PowsyblState>,
    settings_state: &State<'_, settings::SettingsState>,
    feeder_id: String,
    channel: Channel<TelemetryCurves>,
) -> PowsyblResult<()> {
    let mut state_guard = powsybl_state.write().map_err(|_| PowsyblError::LockError)?;

    let zmq_config = ZmqConfig {
        url: settings_state
            .zmq_url
            .read()
            .map_err(|_| PowsyblError::LockError)?
            .clone()
            .unwrap_or_else(|| ZmqConfig::default().url),
    };

    info!("Using ZMQ URL: {}", zmq_config.url);

    state_guard.spawn_task(feeder_id.clone(), |shutdown_rx| {
        let subscription =
            ZmqSubscription::new(feeder_id.clone(), zmq_config.clone(), channel.clone());

        tokio::spawn(async move {
            if let Err(e) = subscription.start(shutdown_rx).await {
                error!(
                    "Subscription error for feeder {}: {:?}",
                    feeder_id.clone(),
                    e
                );
            }
        })
    });

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_single_line_diagram(
    powsybl_state: State<'_, PowsyblState>,
    settings_state: State<'_, settings::SettingsState>,
    sld_metadata: SldMetadata,
    on_event: Channel<TelemetryCurves>,
) -> PowsyblResult<SldSubscriptionResponse> {
    debug!(
        "subscribe_single_line_diagram called with SLD metadata: {:?}",
        sld_metadata
    );

    let active_feeders = sld_metadata.get_active_arrow_feeders();
    info!("Active feeders found: {}", active_feeders.len());

    for feeder in active_feeders {
        let feeder_id = feeder.id.clone();

        // Check if task already exists
        if powsybl_state
            .read()
            .map_err(|_| PowsyblError::LockError)?
            .has_task(&feeder_id)
        {
            debug!("Task already exists for feeder {}, skipping", feeder_id);
            continue;
        }

        // Create and spawn subscription task
        create_subscription_task(&powsybl_state, &settings_state, feeder_id, on_event.clone())
            .await?;
    }

    info!("subscribe_single_line_diagram completed successfully");
    Ok(SldSubscriptionResponse {
        status: "connected".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_single_line_diagram(
    powsybl_state: State<'_, PowsyblState>,
    sld_metadata: SldMetadata,
) -> PowsyblResult<SldSubscriptionResponse> {
    info!("unsubscribe_single_line_diagram called");
    let active_feeders = sld_metadata.get_active_arrow_feeders();
    info!("Stopping tasks for {} active feeders", active_feeders.len());

    for feeder in active_feeders {
        let feeder_id = feeder.id.clone();
        let task_id = feeder_id.clone();
        debug!("Attempting to stop task for feeder: {}", feeder_id);

        if let Ok(mut state_guard) = powsybl_state.write() {
            if state_guard.stop_task(&task_id) {
                info!("Task successfully stopped for feeder {}", feeder_id);
            } else {
                debug!("No task found for feeder {}", feeder_id);
            }
        }
    }

    info!("unsubscribe_single_line_diagram completed");
    Ok(SldSubscriptionResponse {
        status: "disconnected".to_string(),
    })
}
