use super::sld_metadata::SldMetadata;
use crate::network::entities::SldSubscriptionResponse;
use crate::network::{entities::TeleInformation, errors::NetworkResult};
use crate::state::AppState;

use rand::{rngs::StdRng, Rng, SeedableRng};
use tauri::{ipc::Channel, State};

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
    on_event: Channel<TeleInformation>,
) -> NetworkResult<SldSubscriptionResponse> {
    let active_feeders = sld_metadata.get_active_arrow_feeders();

    // Pour chaque feeder actif, créer une tâche qui envoie périodiquement des valeurs aléatoires
    for feeder in active_feeders {
        let feeder_id = feeder.id.clone();
        let channel_clone = on_event.clone();

        // Créer un identifiant unique pour la tâche basé sur l'ID du feeder
        let task_id = feeder_id.clone();

        // Vérifier si une tâche n'existe pas déjà pour ce feeder
        if let Ok(state_guard) = state.read() {
            if state_guard.network.has_task(&task_id) {
                continue; // Déjà en cours de surveillance
            }
        }

        // Lancer une tâche pour surveiller ce feeder
        if let Ok(mut state_guard) = state.write() {
            state_guard.network.spawn_task(task_id, |mut shutdown_rx| {
                let feeder_id = feeder_id.clone();
                let channel = channel_clone.clone();

                tokio::spawn(async move {
                    // Utiliser StdRng qui implémente Send
                    // Créer une graine à partir du timestamp actuel
                    let seed = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_nanos() as u64;

                    let mut rng = StdRng::seed_from_u64(seed);

                    loop {
                        // Vérifier si un signal d'arrêt a été reçu
                        if let Ok(_) = shutdown_rx.try_recv() {
                            println!("Arrêt de la surveillance du feeder {}", feeder_id);
                            break;
                        }

                        // Envoyer une valeur aléatoire via le canal
                        tokio::select! {
                            _ = tokio::time::sleep(tokio::time::Duration::from_millis(500)) => {
                                // Générer une valeur aléatoire entre 0.0 et 1.0
                                let random_value = rng.random::<i32>();

                                // Envoyer la valeur via le canal
                                if let Err(e) = channel.send(TeleInformation::TM {
                                    id: feeder_id.clone(),
                                    value: random_value,
                                }) {
                                    println!("Erreur lors de l'envoi de données: {:?}", e);
                                    break; // Sortir si le canal est fermé
                                }
                            }
                            result = shutdown_rx.recv() => {
                                if result.is_ok() {
                                    println!("Signal d'arrêt reçu pour le feeder {}", feeder_id);
                                    break;
                                }
                            }
                        }
                    }

                    println!("Surveillance terminée pour le feeder {}", feeder_id);
                })
            });
        }
    }

    Ok(SldSubscriptionResponse {
        status: "connected".to_string(),
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
) -> NetworkResult<SldSubscriptionResponse> {
    let active_feeders = sld_metadata.get_active_arrow_feeders();

    // Arrêter les tâches pour tous les feeders actifs
    for feeder in active_feeders {
        let feeder_id = feeder.id.clone();
        let task_id = feeder_id.clone();

        if let Ok(mut state_guard) = state.write() {
            if state_guard.network.stop_task(&task_id) {
                println!("Tâche arrêtée pour le feeder {}", feeder_id);
            }
        }
    }

    Ok(SldSubscriptionResponse {
        status: "disconnected".to_string(),
    })
}
