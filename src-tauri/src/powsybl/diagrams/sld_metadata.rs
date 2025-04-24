use super::errors::{PowsyblError, PowsyblResult};
use super::send_zmq_request;
use crate::state::AppState;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashSet;
use tauri::State;


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