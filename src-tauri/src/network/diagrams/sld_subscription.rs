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
                                let random_value = rng.random_range(0..=500);

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


#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use tokio::sync::broadcast;
    use tokio::time;
    use crate::network::state::NetworkState;

    // Helper pour créer un NetworkState avec des tâches factices
    async fn setup_network_state_with_tasks() -> NetworkState {
        let mut network_state = NetworkState::default();
        
        // Ajouter quelques tâches de test
        network_state.spawn_task("task1".to_string(), |rx| {
            tokio::spawn(async move {
                let mut rx = rx;
                loop {
                    if rx.try_recv().is_ok() {
                        break;
                    }
                    time::sleep(Duration::from_millis(10)).await;
                }
            })
        });
        
        network_state.spawn_task("task2".to_string(), |rx| {
            tokio::spawn(async move {
                let mut rx = rx;
                loop {
                    if rx.try_recv().is_ok() {
                        break;
                    }
                    time::sleep(Duration::from_millis(10)).await;
                }
            })
        });
        
        // Attendre brièvement pour s'assurer que les tâches démarrent
        time::sleep(Duration::from_millis(50)).await;
        
        network_state
    }

    #[tokio::test]
    async fn test_has_task() {
        let network_state = setup_network_state_with_tasks().await;
        
        // Vérifier que les tâches attendues existent
        assert!(network_state.has_task("task1"));
        assert!(network_state.has_task("task2"));
        
        // Vérifier qu'une tâche non existante renvoie false
        assert!(!network_state.has_task("nonexistent_task"));
    }

    #[tokio::test]
    async fn test_stop_task_removes_task() {
        let mut network_state = setup_network_state_with_tasks().await;
        
        // Vérifier que la tâche existe avant d'essayer de l'arrêter
        assert!(network_state.has_task("task1"));
        
        // Arrêter la tâche
        let result = network_state.stop_task("task1");
        
        // Vérifier que l'arrêt a réussi
        assert!(result);
        
        // Vérifier que la tâche a été supprimée
        assert!(!network_state.has_task("task1"));
        
        // Vérifier que les autres tâches existent toujours
        assert!(network_state.has_task("task2"));
    }

    #[tokio::test]
    async fn test_stop_nonexistent_task() {
        let mut network_state = setup_network_state_with_tasks().await;
        
        // Essayer d'arrêter une tâche qui n'existe pas
        let result = network_state.stop_task("nonexistent_task");
        
        // Vérifier que l'arrêt a échoué
        assert!(!result);
        
        // Vérifier que les tâches existantes sont toujours là
        assert!(network_state.has_task("task1"));
        assert!(network_state.has_task("task2"));
    }

    #[tokio::test]
    async fn test_spawn_task_adds_to_map() {
        let mut network_state = NetworkState::default();
        
        // Vérifier qu'aucune tâche n'existe au départ
        assert!(network_state.ti_subscriptions.is_empty());
        
        // Ajouter une tâche
        network_state.spawn_task("new_task".to_string(), |rx| {
            tokio::spawn(async move {
                let mut rx = rx;
                loop {
                    if rx.try_recv().is_ok() {
                        break;
                    }
                    time::sleep(Duration::from_millis(10)).await;
                }
            })
        });
        
        // Vérifier que la tâche a été ajoutée
        assert!(network_state.has_task("new_task"));
        assert_eq!(network_state.ti_subscriptions.len(), 1);
    }

    #[tokio::test]
    async fn test_channel_signal_stops_task() {
        let mut network_state = NetworkState::default();
        
        // Variable de test pour vérifier que la tâche s'arrête bien
        let (notify_tx, mut notify_rx) = tokio::sync::oneshot::channel::<()>();
        let notify_tx = std::sync::Arc::new(std::sync::Mutex::new(Some(notify_tx)));
        
        // Créer une tâche qui notifie quand elle s'arrête
        network_state.spawn_task("signal_test".to_string(), |mut shutdown_rx| {
            let notify_tx = notify_tx.clone();
            
            tokio::spawn(async move {
                // Attendre explicitement le signal d'arrêt
                match shutdown_rx.recv().await {
                    Ok(_) => {
                        // Tâche arrêtée par le signal, envoyer notification
                        if let Some(tx) = notify_tx.lock().unwrap().take() {
                            let _ = tx.send(());
                        }
                    }
                    Err(_) => {
                        // Le canal a été fermé par une autre raison
                        println!("Channel closed without signal");
                    }
                }
            })
        });
        
        // S'assurer que la tâche existe
        assert!(network_state.has_task("signal_test"));
        
        // Envoyer le signal d'arrêt manuellement
        if let Some(handle) = network_state.ti_subscriptions.get("signal_test") {
            let _ = handle.shutdown_sender.send(());
        }
        
        // Attendre la notification que la tâche s'est arrêtée (avec timeout)
        let timeout = time::timeout(Duration::from_millis(500), notify_rx).await;
        assert!(timeout.is_ok(), "La tâche ne s'est pas arrêtée après le signal");
        
        // Nettoyer la tâche restante de la map
        network_state.stop_task("signal_test");
    }

    #[tokio::test]
    async fn test_multiple_stop_tasks() {
        let mut network_state = setup_network_state_with_tasks().await;
        
        // Vérifier que les deux tâches existent
        assert!(network_state.has_task("task1"));
        assert!(network_state.has_task("task2"));
        
        // Arrêter les deux tâches
        let result1 = network_state.stop_task("task1");
        let result2 = network_state.stop_task("task2");
        
        // Vérifier que les arrêts ont réussi
        assert!(result1);
        assert!(result2);
        
        // Vérifier que les tâches ont été supprimées
        assert!(!network_state.has_task("task1"));
        assert!(!network_state.has_task("task2"));
        
        // Vérifier que la map est vide
        assert!(network_state.ti_subscriptions.is_empty());
    }
}