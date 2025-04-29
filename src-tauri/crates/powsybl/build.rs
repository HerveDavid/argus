const COMMANDS: &[&str] = &[
    // Substations
    "get_substations",
    "get_substation_by_id",
    "get_paginated_substations",
    "search_substations",
    "load_substations",
    // Voltage levels
    "get_voltage_levels",
    "get_voltage_levels_by_id",
    "get_paginated_voltage_levels",
    "get_voltage_levels_for_substation",
    "search_voltage_levels",
    "load_voltage_levels",
    // Diagrams
    "get_single_line_diagram",
    "get_single_line_diagram_metadata",
    "get_single_line_diagram_with_metadata",
    "subscribe_single_line_diagram",
    "unsubscribe_single_line_diagram",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
