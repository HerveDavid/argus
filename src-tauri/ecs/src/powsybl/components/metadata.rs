use bevy::ecs::component::Component;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Component)]
pub struct Metadata {
    #[serde(rename = "feederInfos")]
    pub feeder_infos: Vec<FeederInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Component)]
pub struct FeederInfo {
    pub id: String,
    #[serde(rename = "equipmentId")]
    pub equipment_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub side: Option<String>,
    #[serde(rename = "componentType")]
    pub component_type: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_feeder_info_deserialization() {
        let json = r#"
        {
            "feederInfos": [
                {
                    "id": "id_46_A_46_ZA_32_6_32__46_PENA_32_1_95_ONE_ARROW_REACTIVE",
                    "equipmentId": ".A.ZA 6 .PENA 1",
                    "side": "ONE",
                    "componentType": "ARROW_REACTIVE"
                },
                {
                    "id": "id_46_A_46_ZA6_46_ACAM_46_1_ARROW_CURRENT",
                    "equipmentId": ".A.ZA6.ACAM.1",
                    "componentType": "ARROW_CURRENT"
                }
            ]
        }
        "#;

        let metadata: Metadata = serde_json::from_str(json).unwrap();
        assert_eq!(metadata.feeder_infos.len(), 2);
        assert_eq!(metadata.feeder_infos[0].side, Some("ONE".to_string()));
        assert_eq!(metadata.feeder_infos[1].side, None);
    }
}
