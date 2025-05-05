use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mapping {
    pub svg_id: String,
    pub equipment_id: String,
    pub dynawo_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReferenceMapper {
    entries: HashMap<Uuid, Mapping>,     // By id
    by_svg: HashMap<String, Uuid>,       // equipmentId -> Vec<id>
    by_equipment: HashMap<String, Uuid>, // equipmentId -> Vec<id>
    by_dynawo: HashMap<String, Uuid>,    // dynawo_id -> id
}

impl ReferenceMapper {
    pub fn new(entries: Vec<Mapping>) -> Self {
        let mut entries_map = HashMap::new();
        let mut by_svg = HashMap::new();
        let mut by_equipment = HashMap::new();
        let mut by_dynawo = HashMap::new();

        for entry in entries {
            let id = Uuid::new_v4();

            entries_map.insert(id.clone(), entry.clone());
            by_svg.insert(entry.svg_id.clone(), id.clone());
            by_equipment.insert(entry.equipment_id.clone(), id.clone());
            by_dynawo.insert(entry.dynawo_id.clone(), id.clone());
        }

        Self {
            entries: entries_map,
            by_svg,
            by_equipment,
            by_dynawo,
        }
    }

    pub fn get_by_uuid(&self, uuid: &Uuid) -> Option<&Mapping> {
        self.entries.get(uuid)
    }

    pub fn get_by_svg(&self, svg_id: &str) -> Option<&Mapping> {
        self.by_svg.get(svg_id).and_then(|id| self.entries.get(id))
    }

    pub fn get_by_equipment(&self, equipment_id: &str) -> Option<&Mapping> {
        self.by_equipment
            .get(equipment_id)
            .and_then(|id| self.entries.get(id))
    }

    pub fn get_by_dynawo(&self, dynawo_id: &str) -> Option<&Mapping> {
        self.by_dynawo
            .get(dynawo_id)
            .and_then(|id| self.entries.get(id))
    }
}
