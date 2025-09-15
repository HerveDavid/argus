use bevy::prelude::*;

use crate::tauri::events::TauriEvent;

use super::{components::Subscription, events::SubscriptionEvent, resource::SubscriberManager};

pub(super) fn send_new_subscription(
    mut tauri_events: EventReader<TauriEvent>,
    mut subscriber: ResMut<SubscriberManager>,
    mut commands: Commands,
    mut event_writer: EventWriter<SubscriptionEvent>,
) {
    for event in tauri_events.read() {
        if let TauriEvent::Subscribe {
            element_id,
            channel,
        } = event
        {
            let entity = commands.spawn(Subscription(element_id.clone())).id();
            event_writer.write(SubscriptionEvent(
                element_id.to_string(),
                entity.clone(),
                channel.clone(),
            ));
            subscriber
                .substations
                .insert(element_id.to_string(), (entity, channel.clone()));
        }
    }
}

pub(super) fn send_remove_subscription(
    mut tauri_events: EventReader<TauriEvent>,
    mut subscriber: ResMut<SubscriberManager>,
    mut commands: Commands,
) {
    for event in tauri_events.read() {
        if let TauriEvent::Unubscribe { element_id } = event {
            if let Some(value) = subscriber.substations.remove(element_id) {
                commands.entity(value.0).despawn();
            }
        }
    }
}

pub fn refresh_subscriptions(
    mut subscriber: ResMut<SubscriberManager>,
    mut commands: Commands,
    mut event_writer: EventWriter<SubscriptionEvent>,
) {
    let keys: Vec<String> = subscriber.substations.keys().cloned().collect();

    for element_id in keys {
        if let Some(value) = subscriber.substations.remove(&element_id) {
            commands.entity(value.0).despawn();

            let entity = commands.spawn(Subscription(element_id.clone())).id();
            event_writer.write(SubscriptionEvent(
                element_id.clone(),
                entity.clone(),
                value.1.clone(),
            ));
            subscriber
                .substations
                .insert(element_id, (entity, value.1.clone()));
        }
    }
}
