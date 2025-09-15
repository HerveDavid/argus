use bevy::prelude::*;

use super::resource::AsyncRt;

pub struct AsyncRtPlugin;

impl Plugin for AsyncRtPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(AsyncRt::default());
    }
}
