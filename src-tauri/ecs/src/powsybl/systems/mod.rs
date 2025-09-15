use std::collections::HashMap;

use bevy::prelude::*;
use tauri::ipc::Channel;

use crate::subscriber::events::SubscriptionEvent;

use super::{
    components::{DiagramEvent, Feeder, SingleLineDiagram, api::SingleLineDiagramResponse},
    resources::PowsyblClient,
};

pub(super) fn handle_subcription_event(
    mut events: EventReader<SubscriptionEvent>,
    mut commands: Commands,
    client: Res<PowsyblClient>,
) {
    for event in events.read() {
        let SubscriptionEvent(element_id, entity, channel) = event;
        spawn_diagram(element_id, entity, channel, &mut commands, &client);
    }
}

fn spawn_diagram(
    element_id: &str,
    entity: &Entity,
    channel: &Channel<DiagramEvent>,
    commands: &mut Commands,
    client: &Res<PowsyblClient>,
) {
    let url = format!("powsybl/single_line_diagram/{}", element_id);
    let response: SingleLineDiagramResponse = client.get(&url).unwrap();

    commands.spawn((
        Name::new(element_id.to_string()),
        SingleLineDiagram {
            id: element_id.to_string(),
            channel: channel.clone(),
        },
        ChildOf(entity.clone()),
    ));

    for feeder in response.metadata.feeder_infos {
        let name = feeder.id.clone();
        commands.spawn((
            Name::new(name.clone()),
            Feeder::new(name),
            ChildOf(entity.clone()),
        ));
    }
}

pub(super) fn log_feeder_to_sld_changes(
    changed_feeders: Query<(&Feeder, &ChildOf), Changed<Feeder>>,
    diagrams: Query<(&SingleLineDiagram, &ChildOf)>,
) {
    // Si pas de feeders changés, on sort
    if changed_feeders.is_empty() {
        return;
    }

    // Créer le mapping parent -> diagramme (type explicite)
    let mut diagrams_by_parent: HashMap<Entity, &SingleLineDiagram> = HashMap::new();
    for (diagram, parent) in diagrams.iter() {
        diagrams_by_parent.insert(parent.0, diagram);
    }

    // Grouper les feeders par parent (type explicite)
    let mut feeders_by_parent: HashMap<Entity, Vec<(String, f64)>> = HashMap::new();

    for (feeder, parent) in changed_feeders.iter() {
        let parent_entity = parent.0;

        // Vérifier que ce parent a bien un diagramme
        if diagrams_by_parent.contains_key(&parent_entity) {
            // Corriger l'accès aux valeurs - values() retourne Vec<f64>, pas Option<Vec<f64>>
            let value = feeder.values().first().copied().unwrap_or(0.0);

            let feeder_data = (feeder.id.clone(), value);

            if let Some(feeders_list) = feeders_by_parent.get_mut(&parent_entity) {
                feeders_list.push(feeder_data);
            } else {
                feeders_by_parent.insert(parent_entity, vec![feeder_data]);
            }
        }
    }

    // Envoyer pour chaque parent qui a des changements
    for (parent_entity, feeder_updates) in feeders_by_parent {
        if let Some(diagram) = diagrams_by_parent.get(&parent_entity) {
            let event = DiagramEvent::FeederUpdate {
                feeders: feeder_updates.clone(),
            };

            match diagram.channel.send(event) {
                Ok(_) => {
                    println!(
                        "✅ SLD '{}': {} feeders envoyés",
                        diagram.id,
                        feeder_updates.len()
                    );
                    for (feeder_id, value) in &feeder_updates {
                        println!("  ├─ {} = {}", feeder_id, value);
                    }
                }
                Err(e) => {
                    eprintln!("❌ Erreur SLD '{}': {e:?}", diagram.id);
                }
            }
        }
    }
}
