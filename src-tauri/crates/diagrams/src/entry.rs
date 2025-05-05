use bimap::BiMap;
use serde::{Deserialize, Serialize};

use crate::entities::Feeders;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entry {
    pub svg_id: String,
    pub equipment_id: String,
    pub dynawo_id: String,
}

#[derive(Debug, Clone)]
pub struct ReferenceMapper {
    entries: Vec<Entry>,
    svg_to_index: BiMap<String, usize>,
    equipment_to_index: BiMap<String, usize>,
    dynawo_to_index: BiMap<String, usize>,
}

impl ReferenceMapper {
    pub fn new(entries: Vec<Entry>) -> Self {
        let mut svg_to_index = BiMap::new();
        let mut equipment_to_index = BiMap::new();
        let mut dynawo_to_index = BiMap::new();

        for (index, entry) in entries.iter().enumerate() {
            svg_to_index.insert(entry.svg_id.clone(), index);
            equipment_to_index.insert(entry.equipment_id.clone(), index);
            dynawo_to_index.insert(entry.dynawo_id.clone(), index);
        }

        Self {
            entries,
            svg_to_index,
            equipment_to_index,
            dynawo_to_index,
        }
    }

    pub fn get_by_index(&self, index: usize) -> Option<&Entry> {
        self.entries.get(index)
    }

    pub fn get_by_svg(&self, svg_id: &str) -> Option<&Entry> {
        self.svg_to_index
            .get_by_left(svg_id)
            .and_then(|&index| self.entries.get(index))
    }

    pub fn get_by_equipment(&self, equipment_id: &str) -> Option<&Entry> {
        self.equipment_to_index
            .get_by_left(equipment_id)
            .and_then(|&index| self.entries.get(index))
    }

    pub fn get_by_dynawo(&self, dynawo_id: &str) -> Option<&Entry> {
        self.dynawo_to_index
            .get_by_left(dynawo_id)
            .and_then(|&index| self.entries.get(index))
    }

    pub fn get_index_by_svg(&self, svg_id: &str) -> Option<usize> {
        self.svg_to_index.get_by_left(svg_id).copied()
    }
}

impl From<Feeders> for ReferenceMapper {
    fn from(feeders: Feeders) -> Self {
        let mut entries = Vec::new();

        for feeder in feeders.data {
            entries.push(Entry {
                svg_id: feeder.id,
                equipment_id: feeder.equipment_id,
                dynawo_id: feeder.dynawo_id,
            });
        }

        Self::new(entries)
    }
}
