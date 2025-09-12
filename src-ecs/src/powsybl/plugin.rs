use bevy::prelude::*;

use super::{
    events::UpdateFeederEvent,
    resources::PowsyblClient,
    systems::{handle_subcription_event, log_feeder_to_sld_changes},
};

pub struct PowsyblPlugin;

impl Plugin for PowsyblPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<PowsyblClient>();

        app.add_event::<UpdateFeederEvent>();

        app.configure_sets(
            Update,
            (PowsyblSet::OnChange, PowsyblSet::Logic, PowsyblSet::Storing).chain(),
        );

        app.add_systems(
            Update,
            (
                (handle_subcription_event).in_set(PowsyblSet::OnChange),
                (log_feeder_to_sld_changes).in_set(PowsyblSet::Storing),
            ),
        );
    }
}

#[derive(SystemSet, Debug, Hash, PartialEq, Eq, Clone)]
enum PowsyblSet {
    OnChange,
    Logic,
    Storing,
}
