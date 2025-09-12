use bevy::prelude::*;

use super::{events::SubscriptionEvent, resource::SubscriberManager, systems::send_new_subscriber};

pub struct SubscriberPlugin;

impl Plugin for SubscriberPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(SubscriberManager::default());

        app.add_event::<SubscriptionEvent>();

        app.configure_sets(Update, (SubscriberSet::OnChange).chain());

        app.add_systems(
            Update,
            (send_new_subscriber)
                .in_set(SubscriberSet::OnChange)
                .run_if(resource_exists_and_changed::<SubscriberManager>),
        );
    }
}

#[derive(SystemSet, Debug, Hash, PartialEq, Eq, Clone)]
enum SubscriberSet {
    OnChange,
}
