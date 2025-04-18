use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

// Base structs
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Size {
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Padding {
    pub left: f64,
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ViewBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dimensions {
    pub width: f64,
    pub height: f64,
    pub viewbox: ViewBox,
}

// Component related structs
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnchorPoint {
    pub orientation: OrientationType,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum OrientationType {
    Vertical,
    Horizontal,
    None,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Transformations {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "LEFT")]
    pub left: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "RIGHT")]
    pub right: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "DOWN")]
    pub down: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Component {
    #[serde(rename = "type")]
    pub component_type: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "styleClass")]
    pub style_class: Option<String>,

    pub size: Size,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "anchorPoints")]
    pub anchor_points: Option<Vec<AnchorPoint>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub transformations: Option<Transformations>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Label {
    pub id: String,
    pub position_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FeederInfo {
    pub id: String,
    pub component_type: String,
    pub equipment_id: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub side: Option<String>,
}

// Node representation
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Node {
    pub id: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub component_type: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub equipment_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub direction: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub labels: Option<Vec<Label>>,

    pub open: bool,
    pub vid: String,
    pub vlabel: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_v_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotation_angle: Option<f64>,
}

// Connection representation
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Wire {
    pub id: String,
    pub node_id1: String,
    pub node_id2: String,
    pub snake_line: bool,
    pub straight: bool,
}

// Layout parameters
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LayoutParams {
    pub adapt_cell_height_to_content: bool,
    pub busbars_alignment: String,
    pub cell_width: f64,
    pub cgmes_diagram_name: Option<String>,
    pub cgmes_scale_factor: f64,
    pub cgmes_use_names: bool,
    pub components_on_busbars: Vec<String>,
    pub diagram_padding: Padding,
    pub extern_cell_height: f64,
    pub horizontal_bus_padding: f64,
    pub horizontal_snake_line_padding: f64,
    pub intern_cell_height: f64,
    pub max_component_height: f64,
    pub min_extern_cell_height: f64,
    pub min_space_between_components: f64,
    pub remove_fictitious_switch_nodes: bool,
    pub space_for_feeder_infos: f64,
    pub stack_height: f64,
    pub vertical_snake_line_padding: f64,
    pub vertical_space_bus: f64,
    pub voltage_level_padding: Padding,
    pub zone_layout_snake_line_padding: f64,
}

// SVG parameters
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SvgParams {
    pub active_power_unit: String,
    pub angle_label_shift: f64,
    pub angle_value_precision: i32,
    #[serde(rename = "avoidSVGComponentsDuplication")]
    pub avoid_svg_components_duplication: bool,
    pub bus_info_margin: f64,
    pub buses_legend_added: bool,
    pub css_location: String,
    pub current_unit: String,
    pub current_value_precision: i32,
    pub diagram_name: Option<String>,
    pub display_connectivity_nodes_id: bool,
    pub display_current_feeder_info: bool,
    pub display_equipment_nodes_label: bool,
    pub draw_straight_wires: bool,
    pub feeder_info_symmetry: bool,
    pub feeder_infos_intra_margin: f64,
    pub feeder_infos_outer_margin: f64,
    pub label_centered: bool,
    pub label_diagonal: bool,
    pub language_tag: String,
    pub power_value_precision: i32,
    pub prefix_id: String,
    pub reactive_power_unit: String,
    pub show_grid: bool,
    pub show_internal_nodes: bool,
    pub svg_width_and_height_added: bool,
    pub tooltip_enabled: bool,
    pub undefined_value_symbol: String,
    pub unify_voltage_level_colors: bool,
    pub use_name: bool,
    pub voltage_value_precision: i32,
}

// Constants
pub static SWITCH_COMPONENT_TYPES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    let mut set = HashSet::new();
    set.insert("BREAKER");
    set.insert("DISCONNECTOR");
    set.insert("LOAD_BREAK_SWITCH");
    set
});

pub static FEEDER_COMPONENT_TYPES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    let mut set = HashSet::new();
    set.insert("LINE");
    set.insert("LOAD");
    set.insert("BATTERY");
    set.insert("DANGLING_LINE");
    set.insert("TIE_LINE");
    set.insert("GENERATOR");
    set.insert("VSC_CONVERTER_STATION");
    set.insert("LCC_CONVERTER_STATION");
    set.insert("HVDC_LINE");
    set.insert("CAPACITOR");
    set.insert("INDUCTOR");
    set.insert("STATIC_VAR_COMPENSATOR");
    set.insert("TWO_WINDINGS_TRANSFORMER");
    set.insert("TWO_WINDINGS_TRANSFORMER_LEG");
    set.insert("THREE_WINDINGS_TRANSFORMER");
    set.insert("THREE_WINDINGS_TRANSFORMER_LEG");
    set.insert("PHASE_SHIFT_TRANSFORMER");
    set
});

pub static BUSBAR_SECTION_TYPES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    let mut set = HashSet::new();
    set.insert("BUSBAR_SECTION");
    set
});

pub const MAX_ZOOM_LEVEL: f64 = 10.0;
pub const MIN_ZOOM_LEVEL_SUB: f64 = 0.1;
pub const MIN_ZOOM_LEVEL_VL: f64 = 0.5;

// Main SLD Metadata struct
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SldMetadata {
    pub bus_infos: Vec<serde_json::Value>,
    pub bus_legend_infos: Vec<serde_json::Value>,
    pub components: Vec<Component>,
    pub feeder_infos: Vec<FeederInfo>,
    pub layout_params: LayoutParams,
    pub lines: Vec<serde_json::Value>,
    pub nodes: Vec<Node>,
    pub svg_params: SvgParams,
    pub wires: Vec<Wire>,
}

impl SldMetadata {
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    pub fn to_json_pretty(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }

    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    pub fn get_active_arrow_feeders(&self) -> Vec<FeederInfo> {
        self.feeder_infos
            .iter()
            .filter(|feeder| feeder.component_type == "ARROW_ACTIVE")
            .cloned()
            .collect()
    }
}

// Example usage
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialization_deserialization() {
        let metadata = SldMetadata {
            bus_infos: vec![],
            bus_legend_infos: vec![],
            components: vec![Component {
                component_type: "BREAKER".to_string(),
                style_class: Some("my-class".to_string()),
                size: Size {
                    width: 10.0,
                    height: 20.0,
                },
                anchor_points: Some(vec![AnchorPoint {
                    orientation: OrientationType::Horizontal,
                }]),
                transformations: Some(Transformations {
                    left: Some("translate(-10,0)".to_string()),
                    right: None,
                    down: None,
                }),
            }],
            feeder_infos: vec![],
            layout_params: LayoutParams {
                adapt_cell_height_to_content: true,
                busbars_alignment: "TOP".to_string(),
                cell_width: 20.0,
                cgmes_diagram_name: None,
                cgmes_scale_factor: 1.0,
                cgmes_use_names: true,
                components_on_busbars: vec![],
                diagram_padding: Padding {
                    left: 20.0,
                    top: 20.0,
                    right: 20.0,
                    bottom: 20.0,
                },
                extern_cell_height: 40.0,
                horizontal_bus_padding: 10.0,
                horizontal_snake_line_padding: 10.0,
                intern_cell_height: 30.0,
                max_component_height: 50.0,
                min_extern_cell_height: 20.0,
                min_space_between_components: 5.0,
                remove_fictitious_switch_nodes: true,
                space_for_feeder_infos: 100.0,
                stack_height: 60.0,
                vertical_snake_line_padding: 10.0,
                vertical_space_bus: 100.0,
                voltage_level_padding: Padding {
                    left: 10.0,
                    top: 10.0,
                    right: 10.0,
                    bottom: 10.0,
                },
                zone_layout_snake_line_padding: 10.0,
            },
            lines: vec![],
            nodes: vec![],
            svg_params: SvgParams {
                active_power_unit: "MW".to_string(),
                angle_label_shift: 5.0,
                angle_value_precision: 1,
                avoid_svg_components_duplication: true,
                bus_info_margin: 5.0,
                buses_legend_added: true,
                css_location: "css/diagram.css".to_string(),
                current_unit: "A".to_string(),
                current_value_precision: 0,
                diagram_name: Some("Test Diagram".to_string()),
                display_connectivity_nodes_id: false,
                display_current_feeder_info: true,
                display_equipment_nodes_label: true,
                draw_straight_wires: false,
                feeder_info_symmetry: true,
                feeder_infos_intra_margin: 3.0,
                feeder_infos_outer_margin: 5.0,
                label_centered: true,
                label_diagonal: false,
                language_tag: "en".to_string(),
                power_value_precision: 1,
                prefix_id: "sld_".to_string(),
                reactive_power_unit: "MVAR".to_string(),
                show_grid: false,
                show_internal_nodes: false,
                svg_width_and_height_added: true,
                tooltip_enabled: true,
                undefined_value_symbol: "?".to_string(),
                unify_voltage_level_colors: false,
                use_name: true,
                voltage_value_precision: 1,
            },
            wires: vec![],
        };

        // Serialize to JSON
        let json = metadata.to_json_pretty().unwrap();

        // Deserialize from JSON
        let deserialized = SldMetadata::from_json(&json).unwrap();

        // Check if the original and deserialized are the same
        assert_eq!(metadata.components.len(), deserialized.components.len());
        assert_eq!(
            metadata.components[0].component_type,
            deserialized.components[0].component_type
        );
    }
}
