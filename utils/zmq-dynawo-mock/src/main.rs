use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use zeromq::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryCurves {
    curves: TelemetryData,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryData {
    values: HashMap<String, f64>,
    time: u64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut rng = rand::rng();

    // Liste des identifiants de télémétrie
    let telemetry_ids = vec![
        "NETWORK_MQIS P6_1A_U_value",
        "NETWORK_MQIS P6_1B_U_value",
        "NETWORK_MQIS P6_2A_U_value",
        "NETWORK_MQIS P6_2B_U_value",
        "NETWORK_MQIS P6_3B_U_value",
        "NETWORK_MQIS P6_4B_U_value",
        "NETWORK_MQIS Y631_Q1_value",
        "NETWORK_MQIS Y761_P2_value",
        "NETWORK_MQIS Y761_Q2_value",
        "NETWORK_CISSAL61MQIS_i2_value",
        "NETWORK_MQIS Y631_P1_value",
        "NETWORK_MQIS Y764_P2_value",
        "NETWORK_BACALL61MQIS_P2_value",
        "NETWORK_BLAY5L61MQIS_P2_value",
        "NETWORK_FLOIRL61MQIS_P2_value",
        "NETWORK_MQIS L61REAC._i1_value",
        "NETWORK_MQIS Y631_i1_value",
        "NETWORK_FLEACL61MQIS_i2_value",
        "NETWORK_FLEACL61MQIS_Q2_value",
        "NETWORK_BACALL61MQIS_Q2_value",
        "NETWORK_MQIS Y632_Q1_value",
        "NETWORK_FLOIRL61MQIS_i2_value",
        "NETWORK_MQIS L61REAC._Q2_value",
        "NETWORK_BRUGEL61MQIS_i2_value",
        "NETWORK_BACALL61MQIS_i2_value",
        "NETWORK_FLOIRL62MQIS_i2_value",
        "NETWORK_MQIS Y762_i2_value",
        "NETWORK_FLOIRL62MQIS_P2_value",
        "NETWORK_BRUGEL61MQIS_P2_value",
        "NETWORK_MQIS L61REAC._i2_value",
        "NETWORK_FLEACL61MQIS_P2_value",
        "NETWORK_CUBNEL61MQIS_i2_value",
        "NETWORK_BEC5 L62MQIS_Q2_value",
        "NETWORK_MQIS Y761_i2_value",
        "NETWORK_BLAY5L61MQIS_Q2_value",
        "NETWORK_MQIS Y764_i2_value",
        "NETWORK_CISSAL61MQIS_P2_value",
        "NETWORK_MQIS L61REAC._P1_value",
        "NETWORK_FLOIRL61MQIS_Q2_value",
        "NETWORK_MQIS Y632_P1_value",
        "NETWORK_MQIS Y764_Q2_value",
        "NETWORK_BLAY5L61MQIS_i2_value",
        "NETWORK_MQIS Y762_Q2_value",
        "NETWORK_CUBNEL61MQIS_P2_value",
        "NETWORK_BEC5 L62MQIS_i2_value",
        "NETWORK_MQIS L61REAC._Q1_value",
        "NETWORK_BEC5 L62MQIS_P2_value",
        "NETWORK_BRUGEL61MQIS_Q2_value",
        "NETWORK_MQIS Y762_P2_value",
        "NETWORK_MQIS Y632_i1_value",
        "NETWORK_CUBNEL61MQIS_Q2_value",
        "NETWORK_MQIS L61REAC._P2_value",
        "NETWORK_FLOIRL62MQIS_Q2_value",
        "NETWORK_CISSAL61MQIS_Q2_value",
        "Simulation_stepDurationMs",
    ];

    println!("Starting server");
    let mut socket = zeromq::PubSocket::new();
    socket.bind("tcp://127.0.0.1:5556").await?;

    println!("Start sending loop");
    let mut time_counter: u64 = 0;

    loop {
        // Incrémenter le compteur de temps
        time_counter += 1;

        // Créer un HashMap pour stocker les valeurs
        let mut values = HashMap::new();

        // Générer des valeurs aléatoires pour chaque ID
        for id in &telemetry_ids {
            let value = if id.contains("_U_value") {
                // Valeurs de tension autour de 230-240V
                rng.random_range(230.0..240.0)
            } else if *id == "Simulation_stepDurationMs" {
                // Temps de simulation entre 200-300ms
                rng.random_range(200.0..300.0)
            } else {
                // Pour les autres, générer des valeurs entre -5.0 et 5.0
                rng.random_range(-5.0..5.0)
            };

            values.insert(id.to_string(), value);
        }

        // Créer la structure de données complète
        let telemetry_data = TelemetryCurves {
            curves: TelemetryData {
                values,
                time: time_counter,
            },
        };

        // Sérialiser en JSON
        let json_data = serde_json::to_string(&telemetry_data)?;

        // Créer un message ZMQ avec le sujet "telemetry"
        let mut message = ZmqMessage::from("telemetry");
        message.push_back(json_data.into_bytes().into());

        println!("Sending telemetry data with time: {}", time_counter);
        socket.send(message).await?;

        // Attendre 1 seconde avant d'envoyer le prochain message
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}
