use tauri::{
    Manager, Runtime,
    plugin::{Builder, TauriPlugin},
};

mod diagrams;
mod substations;
mod utils;
mod voltage_levels;

pub mod commands;
pub mod entities;
pub mod errors;
pub mod state;

use commands::*;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("powsybl")
        .invoke_handler(tauri::generate_handler![
            // Substations
            get_substations,
            get_substation_by_id,
            get_paginated_substations,
            search_substations,
            load_substations,
            // Voltage levels
            get_voltage_levels,
            get_voltage_levels_by_id,
            get_paginated_voltage_levels,
            get_voltage_levels_for_substation,
            search_voltage_levels,
            load_voltage_levels,
            // Diagrams
            get_single_line_diagram,
            get_single_line_diagram_metadata,
            get_single_line_diagram_with_metadata,
            subscribe_single_line_diagram,
            unsubscribe_single_line_diagram,
        ])
        .setup(|app, _api| {
            app.manage(state::PowsyblState::default());
            Ok(())
        })
        .build()
}
