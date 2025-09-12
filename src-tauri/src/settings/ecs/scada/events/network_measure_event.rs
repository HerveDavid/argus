use bevy::prelude::*;
use serde::{Deserialize, Serialize};

use super::{legacy::LegacyMessage, ts_tm::TsTmMessage};

#[derive(Debug, Clone, Serialize, Deserialize, Event)]
#[serde(untagged)]
pub enum NetworkMeasureEvent {
    TsTm(TsTmMessage),
    Legacy(LegacyMessage),
}
