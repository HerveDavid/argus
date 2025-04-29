const COMMANDS: &[&str] = &[
    // Substations
    "get-substations",
    "get-substation-by-id",
    "get-paginated-substations",
    "search-substations",
    "load-substations",
    // Voltage levels
    "get-voltage-levels",
    "get-voltage-levels-by-id",
    "get-paginated-voltage-levels",
    "get-voltage-levels-for-substation",
    "search-voltage-levels",
    "load-voltage-levels",
    // Diagrams
    "get-single-line-diagram",
    "get-single-line-diagram-metadata",
    "get-single-line-diagram-with-metadata",
    "subscribe-single-line-diagram",
    "unsubscribe-single-line-diagram",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
