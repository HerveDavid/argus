use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub enum FeederEvent<'a> {
    Scada { graphical_id: &'a str, value: f64 },
    GameMaster { graphical_id: &'a str, value: f64 },
}