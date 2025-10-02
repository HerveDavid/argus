use bevy::prelude::*;

use crate::mode::resources::{Kind, Mode};

use super::{
    events::NetworkMeasureEvent,
    resources::ScadaConfig,
    systems::{handlers, inputs, subscriptions},
};

pub struct ScadaPlugin;

impl Plugin for ScadaPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<ScadaConfig>();

        app.add_event::<NetworkMeasureEvent>();

        app.configure_sets(
            Update,
            (
                ScadaSet::Error,
                (
                    ScadaSet::Subscription,
                    ScadaSet::Input,
                    ScadaSet::Logic,
                    ScadaSet::Storing,
                )
                    .chain(),
            )
                .run_if(is_scada_mode),
        );

        app.add_systems(
            Update,
            (
                (
                    subscriptions::spawn_scada_subscription,
                    subscriptions::spawn_scada_output,
                )
                    .chain()
                    .in_set(ScadaSet::Subscription),
                (inputs::nats_receiver_to_events, inputs::nats_to_scada)
                    .chain()
                    .in_set(ScadaSet::Input),
                (
                    handlers::handle_feeder_event,
                    handlers::handle_measure_to_feeder,
                )
                    .in_set(ScadaSet::Logic),
            ),
        );
    }
}

#[derive(SystemSet, Debug, Hash, PartialEq, Eq, Clone)]
enum ScadaSet {
    Error,
    Subscription,
    Input,
    Logic,
    Storing,
}

fn is_scada_mode(mode: Res<Mode>) -> bool {
    matches!(mode.kind, Kind::Scada)
}
