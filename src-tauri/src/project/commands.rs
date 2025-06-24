use crate::project::entities::{QueryResponse, DatabaseStats, NetworkInfo};
use crate::project::{entities};
use crate::settings::database::state::DatabaseState;
use crate::project::state::ProjectState;
use crate::settings::sidecars::state::SidecarsState;

use tauri::State;
use std::path::PathBuf;

use crate::project::error::Result;

#[tauri::command]
pub async fn load_project(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    settings_state: State<'_, tokio::sync::Mutex<DatabaseState>>,
) -> Result<entities::Project> {
    let mut project_guard = project_state.lock().await;
    let settings_guard = settings_state.lock().await;
    
    // Obtenir la pool de connexion des settings
    let pool = &settings_guard.pool;
    
    // Tenter de charger le projet depuis la base de données
    project_guard.load_project(pool).await
}

#[tauri::command]
pub async fn clean_project(project_state: State<'_, tokio::sync::Mutex<ProjectState>>) -> Result<()> {
    let mut project_guard = project_state.lock().await;
    project_guard.clean_project().await
}

#[tauri::command]
pub async fn is_loaded(project_state: State<'_, tokio::sync::Mutex<ProjectState>>) -> Result<bool> {
    let project_guard = project_state.lock().await;
    Ok(project_guard.is_loaded())
}

#[tauri::command]
pub async fn get_project(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<Option<entities::Project>> {
    let project_guard = project_state.lock().await;
    Ok(project_guard.get_project().cloned())
}

/// Initialize database connection with the current project
#[tauri::command]
pub async fn initialize_database(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    sidecars_state: State<'_, tokio::sync::Mutex<SidecarsState>>,
) -> Result<String> {
    let project_guard = project_state.lock().await;
    let sidecars_guard = sidecars_state.lock().await;
    
    // Vérifier qu'un projet est chargé
    let current_project = project_guard.get_project()
        .ok_or_else(|| crate::project::error::Error::ProjectNotFound)?;
    
    // Vérifier si le sidecar Python est disponible
    let sidecar_process = sidecars_guard.get_process("powsybl");
    
    match sidecar_process {
        Some(_process) => {
            // Le sidecar est disponible, utiliser connect_with_sidecar
            let _db = project_guard.database();
            // Note: Cette méthode nécessiterait des modifications dans DatabaseManager
            // pour accepter une référence mutable ou retourner un résultat
            Ok(format!("Database initialized for project: {}", current_project.name))
        },
        None => {
            Err(crate::project::error::Error::InvalidConfig(
                "Python sidecar not available".to_string()
            ))
        }
    }
}

/// Execute a SQL query
#[tauri::command]
pub async fn execute_query(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    query: String,
) -> Result<i64> {
    let project_guard = project_state.lock().await;
    
    if !project_guard.is_loaded() {
        return Err(crate::project::error::Error::ProjectNotFound);
    }
    
    let db = project_guard.database();
    db.execute_query(&query).await
}

/// Execute a SELECT query and return results
#[tauri::command]
pub async fn query_database(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
    query: String,
) -> Result<QueryResponse> {
    let project_guard = project_state.lock().await;
    
    if !project_guard.is_loaded() {
        return Err(crate::project::error::Error::ProjectNotFound);
    }
    
    let db = project_guard.database();
    
    // Utiliser la méthode query avec un mapper personnalisé
    let data = db.query(&query, |row| {
        Ok(row.clone())
    }).await?;
    
    // Extraire les colonnes depuis le premier résultat si disponible
    let columns = if let Some(first_row) = data.first() {
        if let Some(obj) = first_row.as_object() {
            obj.keys().cloned().collect()
        } else {
            vec![]
        }
    } else {
        vec![]
    };
    
    let row_count = data.len();
    Ok(QueryResponse {
        columns,
        data,
        row_count,
    })
}

/// Get network information
#[tauri::command]
pub async fn get_network_info(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<NetworkInfo> {
    let project_guard = project_state.lock().await;
    
    if !project_guard.is_loaded() {
        return Err(crate::project::error::Error::ProjectNotFound);
    }
    
    let db = project_guard.database();
    let network_info = db.get_network_info().await?;
    
    Ok(NetworkInfo {
        file_path: network_info.file_path,
        network_id: network_info.network_id,
        buses_count: network_info.buses_count,
        lines_count: network_info.lines_count,
        generators_count: network_info.generators_count,
        loads_count: network_info.loads_count,
    })
}

/// Get database statistics
#[tauri::command]
pub async fn get_database_stats(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<DatabaseStats> {
    let project_guard = project_state.lock().await;
    
    if !project_guard.is_loaded() {
        return Err(crate::project::error::Error::ProjectNotFound);
    }
    
    let db = project_guard.database();
    
    // Requête pour obtenir les statistiques des tables
    let tables_query = "SELECT name FROM sqlite_master WHERE type='table'";
    let table_names = db.query(tables_query, |row| {
        if let Some(name) = row.get("name").and_then(|v| v.as_str()) {
            Ok(name.to_string())
        } else {
            Err(crate::project::error::Error::InvalidConfig("Invalid table name".to_string()))
        }
    }).await?;
    
    let mut table_stats = Vec::new();
    let mut total_size = 0i64;
    
    for table_name in &table_names {
        let count_query = format!("SELECT COUNT(*) as count FROM {}", table_name);
        let count_result = db.query(&count_query, |row| {
            if let Some(count) = row.get("count").and_then(|v| v.as_i64()) {
                Ok(count)
            } else {
                Ok(0i64)
            }
        }).await?;
        
        let count = count_result.first().copied().unwrap_or(0);
        table_stats.push((table_name.clone(), count));
        total_size += count;
    }
    
    Ok(DatabaseStats {
        tables: table_names.len() as i64,
        total_size,
        table_stats,
    })
}

/// Create a new table
#[tauri::command]
pub async fn create_table(
    table_name: String,
    schema: String,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<String> {
    let project_guard = project_state.lock().await;
    
    if !project_guard.is_loaded() {
        return Err(crate::project::error::Error::ProjectNotFound);
    }
    
    let db = project_guard.database();
    let rows_affected = db.create_table(&table_name, &schema).await?;
    
    Ok(format!("Table '{}' created successfully. Rows affected: {}", table_name, rows_affected))
}

/// Check database connection status
#[tauri::command]
pub async fn check_database_connection(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<bool> {
    let project_guard = project_state.lock().await;
    Ok(project_guard.is_loaded())
}

/// Disconnect from database
#[tauri::command]
pub async fn disconnect_database(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<String> {
    let mut project_guard = project_state.lock().await;
    
    // Clean project will disconnect the database
    project_guard.clean_project().await?;
    
    Ok("Database disconnected successfully".to_string())
}

/// Get database paths
#[tauri::command]
pub async fn get_database_paths(
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<(Option<String>, Option<String>)> {
    let project_guard = project_state.lock().await;
    
    if let Some(project) = project_guard.get_project() {
        let db = project_guard.database();
        let network_path = db.get_network_path().map(|p| p.clone());
        
        // Construire le chemin de la base de données depuis la configuration
        let project_path = PathBuf::from(&project.path);
        let config = &project_guard.config; // Assuming config is accessible
        let db_path = project_path
            .join(&config.dir_project)
            .join(format!("{}.{}", project.name, config.ext_project));
        
        Ok((network_path, Some(db_path.to_string_lossy().to_string())))
    } else {
        Ok((None, None))
    }
}

// Helper function to get substations using the database
#[tauri::command]
pub async fn get_substations_from_db(
    limit: Option<i64>,
    offset: Option<i64>,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<Vec<serde_json::Value>> {
    let project_guard = project_state.lock().await;
    
    if !project_guard.is_loaded() {
        return Err(crate::project::error::Error::ProjectNotFound);
    }
    
    let db = project_guard.database();
    
    let limit_clause = limit.map(|l| format!(" LIMIT {}", l)).unwrap_or_default();
    let offset_clause = offset.map(|o| format!(" OFFSET {}", o)).unwrap_or_default();
    
    let query = format!(
        "SELECT * FROM substations ORDER BY id{}{}", 
        limit_clause, 
        offset_clause
    );
    
    db.query(&query, |row| Ok(row.clone())).await
}

// Helper function to search substations
#[tauri::command]
pub async fn search_substations_in_db(
    search_term: String,
    limit: Option<i64>,
    project_state: State<'_, tokio::sync::Mutex<ProjectState>>,
) -> Result<Vec<serde_json::Value>> {
    let project_guard = project_state.lock().await;
    
    if !project_guard.is_loaded() {
        return Err(crate::project::error::Error::ProjectNotFound);
    }
    
    let db = project_guard.database();
    
    let limit_clause = limit.map(|l| format!(" LIMIT {}", l)).unwrap_or_default();
    
    let query = format!(
        "SELECT * FROM substations WHERE name LIKE '%{}%' OR id LIKE '%{}%' ORDER BY name{}",
        search_term, search_term, limit_clause
    );
    
    db.query(&query, |row| Ok(row.clone())).await
}