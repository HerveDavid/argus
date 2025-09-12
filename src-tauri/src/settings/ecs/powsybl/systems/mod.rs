use std::collections::HashMap;

use bevy::prelude::*;

use crate::settings::ecs::subscriber::{components::Subscription, events::SubscriptionEvent};

use super::{
    components::{api::SingleLineDiagramResponse, Feeder},
    resources::PowsyblClient,
};

pub(super) fn handle_subcription_event(
    mut events: EventReader<SubscriptionEvent>,
    mut commands: Commands,
    client: Res<PowsyblClient>,
) {
    for event in events.read() {
        let SubscriptionEvent(element_id, entity) = event;
        spawn_diagram(element_id, entity, &mut commands, &client);
    }
}

fn spawn_diagram(
    element_id: &str,
    entity: &Entity,
    commands: &mut Commands,
    client: &Res<PowsyblClient>,
) {
    let url = format!("powsybl/single_line_diagram/{}", element_id);
    let response: SingleLineDiagramResponse = client.get(&url).unwrap();

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
    subscriptions: Query<&Subscription>,
) {
    let mut changes_by_sld: HashMap<String, Vec<(String, &Feeder)>> = HashMap::new();

    for (feeder, child_of) in &changed_feeders {
        if let Ok(sld) = subscriptions.get(child_of.0) {
            changes_by_sld
                .entry(sld.0.clone())
                .or_insert_with(Vec::new)
                .push((feeder.id.clone(), feeder));
        }
    }

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
