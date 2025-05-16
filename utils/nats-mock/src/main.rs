use rand::Rng;

// use serde::{Deserialize, Serialize};

use std::collections::HashMap;

use std::time::Duration;

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

    println!("Connecting to NATS server");

    let client = async_nats::connect("nats://localhost:4222").await?;

    println!("Start sending loop");

    let mut time_counter: u64 = 0;

    loop {
        time_counter += 1;

        let mut values = HashMap::new();

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

                // Line without semicolon is return, what is this? Matlab?
            };

            values.insert(id.to_string(), value);

            let message = format!("{{{}: {}}}", id, value);

            let subject = "GameMaster.MQIS"; // All ID seem to come from the MQIS substation

            client.publish(subject, message.clone().into()).await?;
            println!("Client publish {}", message);
        }

        let time_string = format!("{}", time_counter);

        client.publish("time", time_string.into()).await?;

        // Attendre 1 seconde avant d'envoyer le prochain message

        tokio::time::sleep(Duration::from_secs(1)).await;

        if time_counter > 50 {
            break;
        }
    }

    // Unreachable statement provided for completeness

    client.publish("stop", "stop".into()).await?;

    // Flush internal buffer before exiting to make sure all messages are sent

    Ok(client.flush().await?)
}
