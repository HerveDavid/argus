use bimap::BiMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DynawoGameMasterOutput {
    id: String,

    #[serde(rename = "dynamo_id")]
    dynamo_id: String,

    #[serde(rename = "equipmentId")]
    equipment_id: String,

    #[serde(rename = "svgId")]
    svg_id: String,

    #[serde(rename = "componentType")]
    component_type: String,

    topic: String,

    side: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DynawoGameMasterOutputs {
    values: Vec<DynawoGameMasterOutput>,
}

pub struct IdMapper {
    id_dynamo: BiMap<String, String>,
    id_equipment: BiMap<String, String>,
    id_svg: BiMap<String, String>,
}

impl IdMapper {
    fn new(outputs: &[DynawoGameMasterOutput]) -> Self {
        let mut mapper = IdMapper {
            id_dynamo: BiMap::new(),
            id_equipment: BiMap::new(),
            id_svg: BiMap::new(),
        };

        for output in outputs {
            mapper
                .id_dynamo
                .insert(output.id.clone(), output.dynamo_id.clone());
            mapper
                .id_equipment
                .insert(output.id.clone(), output.equipment_id.clone());
            mapper
                .id_svg
                .insert(output.id.clone(), output.svg_id.clone());
        }

        mapper
    }

    fn dynamo_from_id(&self, id: &str) -> Option<&String> {
        self.id_dynamo.get_by_left(id)
    }

    fn id_from_dynamo(&self, dynamo_id: &str) -> Option<&String> {
        self.id_dynamo.get_by_right(dynamo_id)
    }

    fn equipment_from_id(&self, id: &str) -> Option<&String> {
        self.id_equipment.get_by_left(id)
    }

    fn id_from_equipment(&self, equipment_id: &str) -> Option<&String> {
        self.id_equipment.get_by_right(equipment_id)
    }

    fn svg_from_id(&self, id: &str) -> Option<&String> {
        self.id_svg.get_by_left(id)
    }

    fn id_from_svg(&self, svg_id: &str) -> Option<&String> {
        self.id_svg.get_by_right(svg_id)
    }

    // Fonctions dérivées pour les autres combinaisons
    fn equipment_from_dynamo(&self, dynamo_id: &str) -> Option<&String> {
        // Dynamo -> ID -> Equipment
        self.id_from_dynamo(dynamo_id)
            .and_then(|id| self.equipment_from_id(id))
    }

    fn dynamo_from_equipment(&self, equipment_id: &str) -> Option<&String> {
        // Equipment -> ID -> Dynamo
        self.id_from_equipment(equipment_id)
            .and_then(|id| self.dynamo_from_id(id))
    }

    fn svg_from_dynamo(&self, dynamo_id: &str) -> Option<&String> {
        // Dynamo -> ID -> SVG
        self.id_from_dynamo(dynamo_id)
            .and_then(|id| self.svg_from_id(id))
    }

    fn dynamo_from_svg(&self, svg_id: &str) -> Option<&String> {
        // SVG -> ID -> Dynamo
        self.id_from_svg(svg_id)
            .and_then(|id| self.dynamo_from_id(id))
    }

    fn svg_from_equipment(&self, equipment_id: &str) -> Option<&String> {
        // Equipment -> ID -> SVG
        self.id_from_equipment(equipment_id)
            .and_then(|id| self.svg_from_id(id))
    }

    fn equipment_from_svg(&self, svg_id: &str) -> Option<&String> {
        // SVG -> ID -> Equipment
        self.id_from_svg(svg_id)
            .and_then(|id| self.equipment_from_id(id))
    }
}
