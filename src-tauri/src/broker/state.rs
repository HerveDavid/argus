use async_nats::Message;
use futures::stream::StreamExt;
use std::collections::HashMap;

use super::errors::BrokerResult;

#[derive(Default)]
pub struct BrokerState {
    pub telemetry_values: HashMap<String, f64>,
    pub last_time: u64,
}

impl BrokerState {
    pub async fn connect(&mut self) -> BrokerResult<()> {
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

        println!("En attente de messages...");

        loop {
            tokio::select! {
                Some(msg) = telemetry_subscription.next() => {
                    Self::process_telemetry_message(msg, &mut self.telemetry_values);
                }
                Some(msg) = time_subscription.next() => {
                    if let Ok(time_str) = std::str::from_utf8(&msg.payload) {
                        if let Ok(_) = time_str.parse::<u64>() {

                            // Afficher un résumé des valeurs actuelles
                            if !self.telemetry_values.is_empty() {
                                println!("Résumé des télémétries (échantillon de 5 valeurs):");
                                for (i, (key, value)) in self.telemetry_values.iter().take(5).enumerate() {
                                    println!("{}: {} = {:.2}", i+1, key, value);
                                }
                                println!("... et {} autres valeurs", self.telemetry_values.len() - 5);
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

        Ok(())
    }

    fn process_telemetry_message(msg: Message, values: &mut HashMap<String, f64>) {
        if let Ok(payload) = std::str::from_utf8(&msg.payload) {
            // Le format attendu est "ID:VALEUR"
            if let Some(index) = payload.find(':') {
                let (id, value_str) = payload.split_at(index);
                // Ignorer le ':' dans value_str
                let value_str = &value_str[1..];

                if let Ok(value) = value_str.parse::<f64>() {
                    values.insert(id.to_string(), value);
                    println!("Télémétrie reçue: {} = {:.2}", id, value);
                }
            }
        }
    }
}
