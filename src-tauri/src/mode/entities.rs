use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ModeCommand {
    Scada,
    GameMaster,
    Kpi,
}