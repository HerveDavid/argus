use bevy::prelude::*;

use crate::mode::resources::Mode;

use super::{
    events::SubscriptionEvent,
    resource::SubscriberManager,
    systems::{refresh_subscriptions, send_new_subscription, send_remove_subscription},
};

pub struct SubscriberPlugin;

impl Plugin for SubscriberPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(SubscriberManager::default());

        app.add_event::<SubscriptionEvent>();

        app.configure_sets(Update, (SubscriberSet::OnChange).chain());

        app.add_systems(
            Update,
            (
                (send_new_subscription, send_remove_subscription).in_set(SubscriberSet::OnChange),
                refresh_subscriptions
                    .run_if(resource_changed::<Mode>)
                    .in_set(SubscriberSet::OnChange),
            ),
        );
    }
}

#[derive(SystemSet, Debug, Hash, PartialEq, Eq, Clone)]
enum SubscriberSet {
    OnChange,
}
