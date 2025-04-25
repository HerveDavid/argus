use super::sld_metadata::SldMetadata;
use super::super::errors::PowsyblResult;
use super::super::entities::{SldSubscriptionResponse, TelemetryCurves};

use crate::state::AppState;

use serde_json;
use tauri::{ipc::Channel, State};
use zeromq::{Socket, SocketRecv};

// /// ZMQ subscription for single line diagram updates
// /// This function sets up a subscription for diagram updates
// #[tauri::command(rename_all = "snake_case")]
// pub async fn subscribe_single_line_diagram_n(
//     _state: State<'_, AppState>,
//     line_id: String,
// ) -> PowsyblResult<()> {
//     let params = json!({
//         "id": line_id,
//         "subscribe": true
//     });

//     // Assuming there's a subscription endpoint
//     let _result = send_zmq_request("subscribe_diagram_updates", Some(params)).await?;
//     Ok(())
// }

// /// Unsubscribe from single line diagram updates
// #[tauri::command(rename_all = "snake_case")]
// pub async fn unsubscribe_single_line_diagram_n(
//     _state: State<'_, AppState>,
//     line_id: String,
// ) -> PowsyblResult<()> {
//     let params = json!({
//         "id": line_id,
//         "subscribe": false
//     });

//     let _result = send_zmq_request("subscribe_diagram_updates", Some(params)).await?;
//     Ok(())
// }

#[tauri::command(rename_all = "snake_case")]
pub async fn subscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
    on_event: Channel<TelemetryCurves>,
) -> PowsyblResult<SldSubscriptionResponse> {
    println!("subscribe_single_line_diagram called with SLD metadata: {:?}", sld_metadata);
    let active_feeders = sld_metadata.get_active_arrow_feeders();
    println!("Active feeders found: {}", active_feeders.len());

    for feeder in active_feeders {
        let feeder_id = feeder.id.clone();
        let channel_clone = on_event.clone();
        let task_id = feeder_id.clone();
        println!("Setting up task for feeder: {}", feeder_id);

        if let Ok(state_guard) = state.read() {
            if state_guard.powsybl.has_task(&task_id) {
                println!("Task already exists for feeder {}, skipping", feeder_id);
                continue;
            }
        }

        if let Ok(mut state_guard) = state.write() {
            let zmq_url = state_guard.settings.zmq_url.clone().unwrap_or_else(|| "tcp://127.0.0.1:5556".to_string());
            println!("Using ZMQ URL: {}", zmq_url);

            state_guard.powsybl.spawn_task(task_id, |mut shutdown_rx| {
                let feeder_id = feeder_id.clone();
                let channel = channel_clone.clone();
                let zmq_url = zmq_url.clone();

                tokio::spawn(async move {
                    println!("Démarrage de la surveillance ZMQ pour le feeder {} sur {}", feeder_id, zmq_url);

                    let mut socket = zeromq::SubSocket::new();
                    println!("Socket ZMQ créé");
                    
                    match socket.connect(&zmq_url).await {
                        Ok(_) => println!("Connecté au serveur ZMQ: {}", zmq_url),
                        Err(e) => {
                            println!("Erreur de connexion au serveur ZMQ {}: {:?}", zmq_url, e);
                            return;
                        }
                    }

                    // S'abonner à tous les messages (chaîne vide)
                    if let Err(e) = socket.subscribe("").await {
                        println!("Erreur lors de l'abonnement: {:?}", e);
                        return;
                    }

                    println!("Abonné à tous les messages ZMQ");

                    let mut message_count = 0;
                    
                    loop {
                        if let Ok(_) = shutdown_rx.try_recv() {
                            println!("Arrêt de la surveillance ZMQ du feeder {}", feeder_id);
                            break;
                        }

                        tokio::select! {
                            recv_result = socket.recv() => {
                                match recv_result {
                                    Ok(message) => {
                                        message_count += 1;
                                        println!("Message ZMQ #{} reçu pour feeder {}", 
                                            message_count, feeder_id);
                                        
                                        // Convertir le message en chaîne de caractères
                                        if let Some(frame) = message.get(0) {
                                            let data = String::from_utf8(frame.to_vec())
                                                .unwrap_or_else(|_| String::from("[données non UTF-8]"));
                                            
                                            println!("  Taille des données JSON: {} caractères", data.len());
                                            
                                            // Désérialiser les données JSON
                                            match serde_json::from_str::<TelemetryCurves>(&data) {
                                                Ok(telemetry) => {
                                                    println!("  Désérialisation réussie en TelemetryCurves");
                                                    println!("  Nb de courbes: {}", telemetry.curves.values.len());
                                                    
                                                    if let Err(e) = channel.send(telemetry.clone()) {
                                                        println!("Erreur lors de l'envoi de données via le canal: {:?}", e);
                                                        break;
                                                    } else {
                                                        println!("  Données envoyées avec succès via le canal");
                                                    }
                                                },
                                                Err(e) => {
                                                    println!("  Erreur de désérialisation des données JSON: {:?}", e);
                                                }
                                            }
                                        }
                                    },
                                    Err(e) => {
                                        println!("Erreur de réception ZMQ: {:?}", e);
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

                    println!("Surveillance ZMQ terminée pour le feeder {} - {} messages reçus au total", feeder_id, message_count);
                })
            });
            
            println!("Task spawned for feeder: {}", feeder_id);
        }
    }

    println!("subscribe_single_line_diagram completed successfully");
    Ok(SldSubscriptionResponse {
        status: "connected".to_string(),
    })
}
// La fonction unsubscribe_single_line_diagram reste inchangée
#[tauri::command(rename_all = "snake_case")]
pub async fn unsubscribe_single_line_diagram(
    state: State<'_, AppState>,
    sld_metadata: SldMetadata,
) -> PowsyblResult<SldSubscriptionResponse> {
    println!("unsubscribe_single_line_diagram called");
    let active_feeders = sld_metadata.get_active_arrow_feeders();
    println!("Stopping tasks for {} active feeders", active_feeders.len());

    // Arrêter les tâches pour tous les feeders actifs
    for feeder in active_feeders {
        let feeder_id = feeder.id.clone();
        let task_id = feeder_id.clone();
        println!("Attempting to stop task for feeder: {}", feeder_id);

        if let Ok(mut state_guard) = state.write() {
            if state_guard.powsybl.stop_task(&task_id) {
                println!("Task successfully stopped for feeder {}", feeder_id);
            } else {
                println!("No task found for feeder {}", feeder_id);
            }
        }
    }

    println!("unsubscribe_single_line_diagram completed");
    Ok(SldSubscriptionResponse {
        status: "disconnected".to_string(),
    })
}
