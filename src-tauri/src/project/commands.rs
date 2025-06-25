use crate::settings::database::state::DatabaseState;

use super::entities::{Project, QueryResponse};
use super::error::Result;
use super::state::ProjectState;

use serde_json::{json};
use std::time::Duration;
use tauri::State;

#[tauri::command(rename_all = "snake_case")]
pub async fn load_project(
    setting_state: State<'_, tokio::sync::Mutex<DatabaseState>>,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<Project> {
    // Charger le projet depuis la base de données locale
    let db = setting_state.lock().await;
    let project = {
        let mut project_state_guard = project_state.lock().await;
        project_state_guard
            .repository
            .load_current_project(&db.pool)
            .await?
    };
    
    println!("Loaded project: {:?}", &project);
    
    // Envoyer la requête load_config au serveur Python via ZMQ
    let mut project_state_guard = project_state.lock().await;
    
    let params = json!({
        "config_path": project.config_path
    });
    
    let timeout = Duration::from_secs(30);
    
    match project_state_guard
        .database
        .send_request("load_config", Some(params), timeout)
        .await
    {
        Ok(response) => {
            println!("Python load_config response: {:?}", response);
            
            if let Some(network_info) = response.get("network_load_result") {
                println!("Network loaded successfully: {:?}", network_info);
            }
            
            if let Some(error) = response.get("network_load_error") {
                println!("Warning - Network load error: {:?}", error);
            }
        }
        Err(e) => {
            println!("Warning - Failed to load config via Python: {:?}", e);
        }
    }
    
    Ok(project)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn init_database_project(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    db_path: Option<String>,
) -> Result<String> {
    let mut project_state_guard = project_state.lock().await;
    
    // Utiliser le chemin fourni ou un chemin par défaut
    let database_path = db_path.unwrap_or_else(|| "network.db".to_string());
    
    let timeout = Duration::from_secs(30);
    
    // 1. Configurer le chemin de la base de données
    let set_db_params = json!({
        "db_path": database_path
    });
    
    project_state_guard
        .database
        .send_request("set_database", Some(set_db_params), timeout)
        .await?;
    
    println!("Database path configured: {}", database_path);
    
    // 2. Réinitialiser/créer la base de données avec toutes les tables
    let reset_response = project_state_guard
        .database
        .send_request("reset_database", None, Duration::from_secs(60))
        .await?;
    
    println!("Database initialized successfully: {:?}", reset_response);
    
    Ok(database_path)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn query_project(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    query: String,
) -> Result<QueryResponse> {
    let mut project_state_guard = project_state.lock().await;

    let params = json!({
        "query": query
    });

    let timeout = Duration::from_secs(30);

    let response = project_state_guard
        .database
        .send_request("execute_query", Some(params), timeout)
        .await?;

    // Parser la réponse
    let columns = response
        .get("columns")
        .and_then(|c| c.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default();

    let data = response
        .get("data")
        .and_then(|d| d.as_array())
        .cloned()
        .unwrap_or_default();

    let row_count = response
        .get("row_count")
        .and_then(|r| r.as_u64())
        .unwrap_or(0) as usize;

    Ok(QueryResponse {
        columns,
        data,
        row_count,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_new_project(
    setting_state: State<'_, tokio::sync::Mutex<DatabaseState>>,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    name: String,
    path: String,
    config_path: String,
) -> Result<Project> {
    let db = setting_state.lock().await;
    let project_state_guard = project_state.lock().await;
    
    // Créer le nouveau projet
    let new_project = Project {
        name,
        path,
        config_path,
        last_accessed: chrono::Utc::now(),
    };
    
    // Sauvegarder dans la base de données locale en tant que projet courant
    project_state_guard
        .repository
        .set_current_project(&db.pool, &new_project)
        .await?;
    
    println!("Created new project: {:?}", &new_project);
    
    Ok(new_project)
}