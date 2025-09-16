mod dsl;
mod entities;
mod feeders;
mod game_master;
mod mode;
mod nats;
mod powsybl;
mod project;
mod scada;
mod sessions;
mod settings;
mod tasks;
mod utils;

use tauri::Manager;

const SIDECARS: [&str; 2] = ["powsybl", "powsybl-crdt"];

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

                let mode_state = mode::state::ModeState::new(&settings_db)
                    .await
                    .expect("Failed to initialize mode");

                app.manage(settings_db);
                app.manage(mode_state);

                let broker = settings::broker::state::BrokerState::new()
                    .await
                    .expect("Failed to initialize broker");
                app.manage(broker);

                let sidecars =
                    settings::sidecars::state::SidecarsState::new(&app.handle(), &SIDECARS)
                        .await
                        .expect("Failed to initialize sidecars");
                app.manage(sidecars);

                let session = sessions::state::SessionState::new(&app.handle())
                    .await
                    .expect("Failed to initialize sessions");
                app.manage(session);

                let project_db = project::state::ProjectState::new(&app.handle())
                    .await
                    .expect("Failed to initialize project db");
                app.manage(project_db);

                let gamemaster_state = game_master::state::GameMasterState::new(&app.handle())
                    .await
                    .expect("Failed to initialize gamemaster");
                app.manage(gamemaster_state);

                let tasks = tasks::state::TasksState::new()
                    .await
                    .expect("Failed to initialize tasks");
                app.manage(tasks);

                let nats_state = nats::state::NatsState::new()
                    .await
                    .expect("Failed to initialize nats");
                app.manage(nats_state);

                let ecs_state = settings::ecs::state::EcsState::new()
                    .await
                    .expect("Failed to initialize ecs");
                app.manage(ecs_state);

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
            // Sessions
            sessions::commands::set_session_config,
            sessions::commands::set_session_config_with_file,
            sessions::commands::get_session_status,
            // Mode
            mode::commands::switch_mode,
            mode::commands::get_current_mode,
            // Powsybl
            powsybl::commands::get_tables,
            powsybl::commands::get_table_data,
            powsybl::commands::search_table,
            powsybl::commands::get_item_by_id,
            powsybl::commands::get_database_stats,
            powsybl::commands::get_single_line_diagram,
            powsybl::commands::get_network_area_diagram,
            powsybl::commands::execute_query,
            powsybl::commands::update_battery,
            powsybl::commands::update_generator,
            powsybl::commands::update_switch,
            powsybl::commands::update_load,
            // Scada
            scada::commands::subscribe_scada_feeders,
            scada::commands::subscribe_single_scada_feeder,
            scada::commands::unsubscribe_scada_feeders,
            scada::commands::unsubscribe_all_scada_feeders,
            scada::commands::get_scada_outputs,
            // GameMaster
            game_master::commands::get_game_master_outputs,
            game_master::commands::init_game_master_scenario,
            game_master::commands::trainer_update_system_state_command,
            game_master::commands::trainer_get_current_state_command,
            game_master::commands::get_dsl_file_command,
            game_master::commands::simulator_control_command,
            game_master::commands::sim_update_system_state_command,
            game_master::commands::simulator_control_v2_command,
            game_master::commands::user_control_command,
            game_master::commands::dsl_control_command,
            game_master::commands::cluster_control_command,
            game_master::commands::user_get_current_state_command,
            game_master::commands::get_pending_controls_command,
            game_master::commands::upload_iidm_file_command,
            game_master::commands::get_iidm_properties_command,
            game_master::commands::list_events_command,
            game_master::commands::get_queue_summary_command,
            // Nats
            nats::commands::set_nats_address,
            nats::commands::connect_nats,
            nats::commands::disconnect_nats,
            nats::commands::get_nats_connection_status,
            // Feeders
            tasks::commands::start_task,
            tasks::commands::close_task,
            tasks::commands::pause_task,
            tasks::commands::resume_task,
            tasks::commands::list_active_tasks,
            tasks::commands::get_task_count,
            tasks::commands::get_task_status,
            tasks::commands::get_tasks_statistics,
            // Feeder
            feeders::commands::add_nats_feeder,
            // ECS
            settings::ecs::commands::switch_mode_ecs,
            settings::ecs::commands::add_subscription,
            settings::ecs::commands::remove_subscription,
            // DSL
            dsl::commands::start_dsl_file,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                if let Some(sidecars_state) = app_handle
                    .try_state::<tokio::sync::Mutex<settings::sidecars::state::SidecarsState>>()
                {
                    tauri::async_runtime::block_on(async {
                        let mut sidecars = sidecars_state.lock().await;
                        for s in SIDECARS {
                            let _ = sidecars.despawn_sidecar(s);
                        }
                    });
                }
            }
        });
}
