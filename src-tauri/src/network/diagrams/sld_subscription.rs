use super::sld_metadata::SldMetadata;
use crate::network::entities::{SldSubscriptionResponse, TelemetryCurves};
use crate::network::errors::NetworkResult;
use crate::state::AppState;

use serde_json;
use tauri::{ipc::Channel, State};
use zeromq::{Socket, SocketRecv};

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
    on_event: Channel<TelemetryCurves>,
) -> NetworkResult<SldSubscriptionResponse> {
    let active_feeders = sld_metadata.get_active_arrow_feeders();

    // Pour chaque feeder actif, créer une tâche qui écoute les données ZMQ
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

        // Lancer une tâche pour surveiller ce feeder via ZMQ
        if let Ok(mut state_guard) = state.write() {
            // Accéder à l'URL ZMQ depuis les paramètres
            let zmq_url = state_guard.settings.zmq_url.clone().unwrap_or_else(|| "tcp://127.0.0.1:5556".to_string());
            let subscription_topic = feeder_id.clone(); // Utiliser l'ID du feeder comme sujet d'abonnement

            state_guard.network.spawn_task(task_id, |mut shutdown_rx| {
                let feeder_id = feeder_id.clone();
                let channel = channel_clone.clone();
                let zmq_url = zmq_url.clone();
                let subscription_topic = "";

                tokio::spawn(async move {
                    println!("Démarrage de la surveillance ZMQ pour le feeder {} sur {}", feeder_id, zmq_url);

                    // Créer un nouveau socket ZMQ pour cette tâche
                    let mut socket = zeromq::SubSocket::new();
                    
                    // Tentative de connexion au serveur ZMQ
                    match socket.connect(&zmq_url).await {
                        Ok(_) => println!("Connecté au serveur ZMQ: {}", zmq_url),
                        Err(e) => {
                            println!("Erreur de connexion au serveur ZMQ {}: {:?}", zmq_url, e);
                            return;
                        }
                    }

                    // S'abonner au topic correspondant à ce feeder
                    if let Err(e) = socket.subscribe(&subscription_topic).await {
                        println!("Erreur lors de l'abonnement au topic {}: {:?}", subscription_topic, e);
                        return;
                    }

                    println!("Abonné au topic ZMQ: {}", subscription_topic);

                    loop {
                        // Vérifier si un signal d'arrêt a été reçu
                        if let Ok(_) = shutdown_rx.try_recv() {
                            println!("Arrêt de la surveillance ZMQ du feeder {}", feeder_id);
                            break;
                        }

                        // Attendre des données du serveur ZMQ ou un signal d'arrêt
                        tokio::select! {
                            recv_result = socket.recv() => {
                                match recv_result {
                                    Ok(multipart) => {
                                        // Traiter les données reçues
                                        // Convertir le message ZMQ en vecteur de données
                                        let parts: Vec<Vec<u8>> = multipart.iter().map(|frame| frame.to_vec()).collect();
                                        
                                        if parts.len() >= 2 {
                                            // Le premier élément est généralement le topic
                                            let topic = String::from_utf8_lossy(&parts[0]);
                                            
                                            // Le second élément contient les données JSON
                                            let data = &parts[1];
                                            
                                            // Tenter de désérialiser les données en TelemetryCurves
                                            match serde_json::from_slice::<TelemetryCurves>(data) {
                                                Ok(telemetry) => {
                                                    // Envoyer directement l'objet TelemetryCurves via le canal
                                                    if let Err(e) = channel.send(telemetry) {
                                                        println!("Erreur lors de l'envoi de données: {:?}", e);
                                                        break; // Sortir si le canal est fermé
                                                    }
                                                },
                                                Err(e) => {
                                                    println!("Erreur de désérialisation des données ZMQ: {:?}", e);
                                                }
                                            }
                                        }
                                    },
                                    Err(e) => {
                                        println!("Erreur de réception ZMQ: {:?}", e);
                                        // Court délai avant de réessayer
                                        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                                    }
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

                    println!("Surveillance ZMQ terminée pour le feeder {}", feeder_id);
                })
            });
        }
    }

    Ok(SldSubscriptionResponse {
        status: "connected".to_string(),
    })
}

// La fonction unsubscribe_single_line_diagram reste inchangée car elle gère
// déjà correctement l'arrêt des tâches
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