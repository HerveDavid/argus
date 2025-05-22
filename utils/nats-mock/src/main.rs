use rand::Rng;
// use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use async_nats::Subscriber;
use futures::stream::StreamExt;


/*#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryCurves { // Struct that contains nothing but another struct??
curves: TelemetryData,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TelemetryData {
values: HashMap<String, f64>, // TODO: update to new format
time: u64,
}*/

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut rng = rand::thread_rng(); // Correction: rand::rng() -> rand::thread_rng()

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

    println!("Connecting to NATS server");
    let client = async_nats::connect("nats://localhost:4222").await?;
    
    // S'abonner au topic GameMasterControl pour recevoir les messages
    println!("Subscribing to GameMasterControl topic");
    let mut subscriber = client.subscribe("GameMasterControl").await?;
    
    // Créer une tâche pour gérer les messages entrants du GameMasterControl
    let control_client = client.clone();
    tokio::spawn(async move {
        println!("Starting to listen for GameMasterControl messages");
        while let Some(msg) = subscriber.next().await {
            let payload = std::str::from_utf8(&msg.payload).unwrap_or("Invalid UTF-8");
            println!("Received on GameMasterControl: {}", payload);
            
            // Répondre pour confirmer la réception
            if let Err(e) = control_client.publish("GameMasterControlAck", format!("Received: {}", payload).into()).await {
                eprintln!("Failed to publish acknowledgment: {}", e);
            }
        }
    });

    println!("Start sending loop");

    let mut time_counter: f64 = 0.0;

    loop {
        time_counter += 1.0;

        let mut values = HashMap::new();

        for id in &telemetry_ids {
            let value = if id.contains("_U_value") {
                // Valeurs de tension autour de 230-240V
                rng.gen_range(230.0..240.0)
            } else if *id == "Simulation_stepDurationMs" {
                // Temps de simulation entre 200-300ms
                rng.gen_range(200.0..300.0)
            } else {
                // Pour les autres, générer des valeurs entre -5.0 et 5.0
                rng.gen_range(-5.0..5.0)
            };

            values.insert(id.to_string(), value);
            let message = format!("{{\"{}\": {}}}", id, value);

            let subject = "GameMaster.MQIS"; // All ID seem to come from the MQIS substation
            
            client.publish(subject, message.clone().into()).await?;
            // println!("Client publish {}", message);
        }

        let time_string = format!("{}", time_counter);
        client.publish("time", time_string.into()).await?;

        // Publier un résumé sur GameMasterControl
        let status_message = format!("Telemetry cycle {} completed with {} values", time_counter, telemetry_ids.len());
        client.publish("GameMasterControl", status_message.clone().into()).await?;
        println!("Published status to GameMasterControl: {}", status_message);

        // Attendre 1 seconde avant d'envoyer le prochain message
        tokio::time::sleep(Duration::from_secs(1)).await;

        // if time_counter > 50.0 {
        //     break;
        // }

    }

    // Annoncer l'arrêt sur GameMasterControl
    client.publish("GameMasterControl", "Simulation stopping".into()).await?;
    
    // Signal d'arrêt
    client.publish("stop", "stop".into()).await?;

    // Attendre un moment pour que les derniers messages soient traités
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Flush internal buffer before exiting to make sure all messages are sent
    Ok(client.flush().await?)
}