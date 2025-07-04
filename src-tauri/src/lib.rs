mod commands;
mod entities;
mod feeders;
mod nats;
mod project;
mod settings;
mod utils;

use tauri::Manager;

const SIDECARS: [&str; 1] = ["powsybl"];

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::env::set_var("SQLX_LOGGING", "false");
    std::env::set_var("RUST_LOG", "info,sqlx=off");

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .filter(|metadata| !metadata.target().starts_with("sqlx"))
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                app.manage(utils::channels::state::Channels::default());
                app.manage(utils::tasks::state::Tasks::default());

                app.manage(settings::banner::state::BannerState::default());

                println!("-----------------------------------------------");

                let settings_db = settings::database::state::DatabaseState::new(&app.handle())
                    .await
                    .expect("Failed to initialize settings db");
                app.manage(settings_db);

                let broker = settings::broker::state::BrokerState::new()
                    .await
                    .expect("Failed to initialize broker");
                app.manage(broker);

                let sidecars =
                    settings::sidecars::state::SidecarsState::new(&app.handle(), &SIDECARS)
                        .await
                        .expect("Failed to initialize sidecars");
                app.manage(sidecars);

                let project_db = project::state::ProjectState::new(&app.handle())
                    .await
                    .expect("Failed to initialize project db");
                app.manage(project_db);

                let feeders = feeders::state::FeedersState::new()
                    .await
                    .expect("Failed to initialize feeders");
                app.manage(feeders);

                let nats_state = nats::state::NatsState::new()
                    .await
                    .expect("Failed to initialize nats");
                app.manage(nats_state);

                println!("-----------------------------------------------");
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Channels
            utils::channels::commands::register,
            utils::channels::commands::unregister,
            utils::channels::commands::start,
            utils::channels::commands::stop,
            utils::channels::commands::pause,
            utils::channels::commands::get_status,
            utils::channels::commands::list_channels,
            // Database
            settings::database::commands::set_setting,
            settings::database::commands::get_setting,
            settings::database::commands::get_setting_with_default,
            settings::database::commands::get_setting_or_default,
            settings::database::commands::merge_settings,
            settings::database::commands::set_nested_setting,
            settings::database::commands::get_nested_setting,
            settings::database::commands::delete_setting,
            settings::database::commands::list_all_settings,
            settings::database::commands::setting_exists,
            settings::database::commands::clear_all_settings,
            settings::database::commands::count_settings,
            settings::database::commands::set_string_setting,
            settings::database::commands::get_string_setting,
            settings::database::commands::set_bool_setting,
            settings::database::commands::get_bool_setting,
            settings::database::commands::set_number_setting,
            settings::database::commands::get_number_setting,
            // Sidecars
            settings::sidecars::commands::start_sidecar,
            settings::sidecars::commands::shutdown_sidecar,
            // Project
            project::commands::load_project,
            project::commands::init_database_project,
            project::commands::query_project,
            project::commands::create_new_project,
            project::commands::get_single_line_diagram,
            // Nats
            nats::commands::set_nats_address,
            nats::commands::connect_nats,
            nats::commands::disconnect_nats,
            nats::commands::get_nats_connection_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
