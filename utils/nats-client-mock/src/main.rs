use async_nats::Message;
use futures::stream::StreamExt;
use std::collections::HashMap;
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Connexion au serveur NATS...");
    let client = async_nats::connect("nats://localhost:4222").await?;
    println!("Connecté au serveur NATS!");

    // S'abonner au sujet des données de télémétrie
    let mut telemetry_subscription = client.subscribe("GameMaster.MQIS").await?;
    println!("Abonné au sujet 'GameMaster.MQIS'");

    // S'abonner au sujet du temps
    let mut time_subscription = client.subscribe("time").await?;
    println!("Abonné au sujet 'time'");

    // S'abonner au sujet d'arrêt
    let mut stop_subscription = client.subscribe("stop").await?;
    println!("Abonné au sujet 'stop'");

    // Stockage des dernières valeurs de télémétrie
    let mut telemetry_values: HashMap<String, f64> = HashMap::new();
    let mut last_time: f64 = 0.0;
    let start_time = Instant::now();

    println!("En attente de messages...");

    loop {
        tokio::select! {
            Some(msg) = telemetry_subscription.next() => {
                process_telemetry_message(msg, &mut telemetry_values);
            }
            Some(msg) = time_subscription.next() => {
                if let Ok(time_str) = std::str::from_utf8(&msg.payload) {
                    if let Ok(time) = time_str.parse::<f64>() {
                        last_time = time;
                        println!("\nTemps reçu: {}", time);

                        // Afficher un résumé des valeurs actuelles
                        if !telemetry_values.is_empty() {
                            println!("Résumé des télémétries (échantillon de 5 valeurs):");
                            for (i, (key, value)) in telemetry_values.iter().take(5).enumerate() {
                                println!("{}: {} = {:.2}", i+1, key, value);
                            }
                            println!("... et {} autres valeurs", telemetry_values.len() - 5);
                        }
                    }
                }
            }
            Some(msg) = stop_subscription.next() => {
                if let Ok(payload) = std::str::from_utf8(&msg.payload) {
                    if payload == "stop" {
                        println!("Message d'arrêt reçu. Arrêt du client.");
                        break;
                    }
                }
            }
        }
    }

    // Statistiques finales
    let duration = start_time.elapsed();
    println!("\n--- Statistiques de session ---");
    println!("Temps d'exécution: {:.2?}", duration);
    println!("Nombre total de mesures reçues: {}", telemetry_values.len());
    println!("Dernière valeur de temps: {}", last_time);

    Ok(())
}

fn process_telemetry_message(msg: Message, values: &mut HashMap<String, f64>) {
    if let Ok(payload) = std::str::from_utf8(&msg.payload) {
        if let Some(index) = payload.find(':') {
            // Expected format is {"ID": VALUE}
            let (id, value_str) = payload.split_at(index);
            let id = &id[2 .. id.len() - 1];
            let value_str = &value_str[2 .. value_str.len() - 1];

            if let Ok(value) = value_str.parse::<f64>() {
                values.insert(id.to_string(), value);
                println!("Télémétrie reçue: {} = {:.2}", id, value);
            }
        }
    }
}
