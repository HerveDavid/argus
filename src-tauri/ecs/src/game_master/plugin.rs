use bevy::prelude::*;

use crate::mode::resources::{Kind, Mode};

use super::{
    events::{ErrorEvent, MeasureEvent, NetworkMeasureEvent, StepDurationEvent, TimeEvent},
    resources::GameMasterConfig,
    systems::{errors, handlers, inputs, logging, subscriptions},
};

pub struct GameMasterPlugin;

impl Plugin for GameMasterPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<GameMasterConfig>();

        app.add_event::<TimeEvent>();
        app.add_event::<MeasureEvent>();
        app.add_event::<StepDurationEvent>();
        app.add_event::<NetworkMeasureEvent>();
        app.add_event::<ErrorEvent>();

        app.configure_sets(
            Update,
            (
                GameMasterSet::Error,
                (
                    GameMasterSet::Subscription,
                    GameMasterSet::Input,
                    GameMasterSet::Logic,
                    GameMasterSet::Storing,
                )
                    .chain(),
            )
                .run_if(is_game_master_mode),
        );

        app.add_systems(
            Update,
            (
                (
                    subscriptions::spawn_game_master_subscription,
                    subscriptions::time,
                    subscriptions::spawn_game_master_output,
                )
                    .in_set(GameMasterSet::Subscription),
                (inputs::nats_receiver_to_events, inputs::nats_to_game_master)
                    .chain()
                    .in_set(GameMasterSet::Input),
                (
                    handlers::handle_feeder_event,
                    handlers::handle_measure_to_feeder,
                )
                    .in_set(GameMasterSet::Logic),
                (logging::logging_time, logging::logging_step).in_set(GameMasterSet::Storing),
                (errors::handle_errors).in_set(GameMasterSet::Error),
            ),
        );
    }
}

#[derive(SystemSet, Debug, Hash, PartialEq, Eq, Clone)]
enum GameMasterSet {
    Error,
    Subscription,
    Input,
    Logic,
    Storing,
}

fn is_game_master_mode(mode: Res<Mode>) -> bool {
    matches!(mode.kind, Kind::GameMaster)
}
