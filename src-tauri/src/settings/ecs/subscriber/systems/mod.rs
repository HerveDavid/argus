use bevy::prelude::*;

use super::{components::Subscription, events::SubscriptionEvent, resource::SubscriberManager};

pub(super) fn send_new_subscriber(
    changed_subcriber: Res<SubscriberManager>,
    mut commands: Commands,
    mut event_writer: EventWriter<SubscriptionEvent>,
) {
    for substation in changed_subcriber.substations.iter() {
        let entity = commands.spawn(Subscription(substation.clone())).id();

        event_writer.write(SubscriptionEvent(substation.to_string(), entity));
    }
}
