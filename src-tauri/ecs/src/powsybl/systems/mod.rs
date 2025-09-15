use std::collections::HashMap;

use bevy::prelude::*;
use tauri::ipc::Channel;

use crate::subscriber::{components::Subscription, events::SubscriptionEvent};

use super::{
    components::{Feeder, SingleLineDiagram, api::SingleLineDiagramResponse},
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
    channel: &Channel<String>,
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
    subscriptions: Query<&Subscription>,
) {
    // Créer un mapping parent -> SingleLineDiagram pour une recherche efficace
    let diagrams_by_parent: HashMap<Entity, &SingleLineDiagram> = diagrams
        .iter()
        .map(|(diagram, parent)| (parent.0, diagram))
        .collect();

    let mut changes_by_sld: HashMap<String, Vec<(String, &Feeder)>> = HashMap::new();

    for (feeder, feeder_parent) in &changed_feeders {
        // Chercher le SingleLineDiagram qui a le même parent que le Feeder
        if let Some(diagram) = diagrams_by_parent.get(&feeder_parent.0) {
            match diagram.channel.send("Hello world".to_string()) {
                Ok(_) => println!("Message envoyé via channel pour feeder: {}", feeder.id),
                Err(e) => eprintln!("Erreur lors de l'envoi du message: {e:?}"),
            }
        }

        // Logique existante pour grouper les changements par SLD
        if let Ok(sub) = subscriptions.get(feeder_parent.0) {
            changes_by_sld
                .entry(sub.0.clone())
                .or_insert_with(Vec::new)
                .push((feeder.id.clone(), feeder));
        }
    }

    // Affichage des changements groupés par SLD
    if !changes_by_sld.is_empty() {
        println!("Feeder changes by SLD:");
        for (sld_id, feeder_ids) in changes_by_sld {
            println!("  SLD '{}': {} feeders changed", sld_id, feeder_ids.len());
            for feeder in feeder_ids {
                println!(
                    "    ├─ {} = {:?} {:?}",
                    feeder.0,
                    feeder.1.get_range(),
                    feeder.1.values()
                );
            }
        }
    }
}
