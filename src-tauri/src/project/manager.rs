use super::config::ProjectConfig;
use super::entities::{NetworkInfo, PythonRequest, PythonResponse};
use super::error::{Error, Result};

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use tokio::sync::oneshot;
use uuid::Uuid;

pub struct DatabaseManager {
    python_process: Option<Child>,
    pending_requests: Arc<Mutex<HashMap<String, oneshot::Sender<PythonResponse>>>>,
    network_path: Option<String>,
    db_path: Option<String>,
    is_ready: bool,
}

impl Default for DatabaseManager {
    fn default() -> Self {
        Self {
            python_process: None,
            pending_requests: Arc::new(Mutex::new(HashMap::new())),
            network_path: None,
            db_path: None,
            is_ready: false,
        }
    }
}

impl DatabaseManager {
    /// Connect to the database using an existing sidecar process
    pub async fn connect_with_sidecar(&mut self) -> Result<()> {
        // Dans ce cas, le sidecar est déjà démarré par le système de sidecars
        // On n'a pas besoin de démarrer un nouveau processus Python
        self.is_ready = true;
        Ok(())
    }

    /// Connect and initialize everything (network + database)
    pub async fn connect(
        &mut self,
        project_path: &Path,
        project_name: &str,
        config: &ProjectConfig,
    ) -> Result<()> {
        // Start Python server if not using sidecar
        if self.python_process.is_none() {
            self.start_python_server().await?;
        }

        // Find network file
        let network_path = self.find_network_file(project_path)?;
        let db_path = self.get_database_path(project_path, project_name, config);

        // Load everything at once
        self.load_all(&network_path, &db_path).await?;

        self.network_path = Some(network_path);
        self.db_path = Some(db_path.to_string_lossy().to_string());
        self.is_ready = true;

        Ok(())
    }

    /// Use this when the Python sidecar is already running
    pub async fn initialize_with_existing_process(
        &mut self,
        process: Child,
        project_path: &Path,
        project_name: &str,
        config: &ProjectConfig,
    ) -> Result<()> {
        // Set up the existing process
        self.setup_process_communication(process).await?;

        // Find network file
        let network_path = self.find_network_file(project_path)?;
        let db_path = self.get_database_path(project_path, project_name, config);

        // Load everything
        self.load_all(&network_path, &db_path).await?;

        self.network_path = Some(network_path);
        self.db_path = Some(db_path.to_string_lossy().to_string());
        self.is_ready = true;

        Ok(())
    }

    pub fn disconnect(&mut self) {
        if let Some(mut process) = self.python_process.take() {
            // Send shutdown command gracefully
            if let Some(stdin) = process.stdin.as_mut() {
                let shutdown_cmd = serde_json::json!({
                    "type": "request",
                    "id": "shutdown",
                    "method": "shutdown",
                    "params": {}
                });
                let _ = writeln!(stdin, "{}", shutdown_cmd);
                let _ = stdin.flush();
            }

            // Give it a moment to shutdown gracefully
            std::thread::sleep(std::time::Duration::from_millis(100));

            let _ = process.kill();
            let _ = process.wait();
        }
        self.is_ready = false;
        self.network_path = None;
        self.db_path = None;
    }

    pub fn is_connected(&self) -> bool {
        self.is_ready
    }

    /// Execute a SQL query and return the number of affected rows
    pub async fn execute_query(&self, sql: &str) -> Result<i64> {
        if !self.is_connected() {
            return Err(Error::InvalidConfig("No active connection".to_string()));
        }

        let params = serde_json::json!({
            "query": sql
        });

        let response = self.send_request("execute_query", params).await?;

        if response.status != 200 {
            return Err(Error::InvalidConfig(
                response
                    .result
                    .get("error")
                    .and_then(|e| e.as_str())
                    .unwrap_or("Query execution failed")
                    .to_string(),
            ));
        }

        let row_count = response
            .result
            .get("row_count")
            .and_then(|r| r.as_u64())
            .unwrap_or(0) as i64;

        Ok(row_count)
    }

    /// Execute a SQL query and map results using a custom mapper function
    pub async fn query<T, F>(&self, sql: &str, mapper: F) -> Result<Vec<T>>
    where
        F: Fn(&serde_json::Value) -> Result<T>,
    {
        if !self.is_connected() {
            return Err(Error::InvalidConfig("No active connection".to_string()));
        }

        let params = serde_json::json!({
            "query": sql
        });

        let response = self.send_request("execute_query", params).await?;

        if response.status != 200 {
            return Err(Error::InvalidConfig(
                response
                    .result
                    .get("error")
                    .and_then(|e| e.as_str())
                    .unwrap_or("Query execution failed")
                    .to_string(),
            ));
        }

        let data = response
            .result
            .get("data")
            .and_then(|d| d.as_array())
            .ok_or_else(|| Error::InvalidConfig("Invalid query response format".to_string()))?;

        let mut results = Vec::new();
        for row in data {
            results.push(mapper(row)?);
        }

        Ok(results)
    }

    /// Create a table with the given schema
    pub async fn create_table(&self, table_name: &str, schema: &str) -> Result<i64> {
        let sql = format!("CREATE TABLE IF NOT EXISTS {} ({})", table_name, schema);
        self.execute_query(&sql).await
    }

    /// Get network information
    pub async fn get_network_info(&self) -> Result<NetworkInfo> {
        if !self.is_connected() {
            return Err(Error::InvalidConfig("No active connection".to_string()));
        }

        let response = self
            .send_request("get_network_info", serde_json::json!({}))
            .await?;

        if response.status != 200 {
            return Err(Error::InvalidConfig(
                response
                    .result
                    .get("error")
                    .and_then(|e| e.as_str())
                    .unwrap_or("Failed to get network info")
                    .to_string(),
            ));
        }

        let network_info: NetworkInfo = serde_json::from_value(response.result)
            .map_err(|e| Error::InvalidConfig(format!("Invalid network info format: {}", e)))?;

        Ok(network_info)
    }

    /// Ping the server to check if it's alive
    pub async fn ping(&self) -> Result<bool> {
        if self.python_process.is_none() {
            return Ok(false);
        }

        match self.send_request("ping", serde_json::json!({})).await {
            Ok(response) => Ok(response.status == 200),
            Err(_) => Ok(false),
        }
    }

    // Private methods
    async fn start_python_server(&mut self) -> Result<()> {
        let cmd = Command::new("python")
            .arg("-m")
            .arg("src.main")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| Error::InvalidConfig(format!("Failed to start Python server: {}", e)))?;

        self.setup_process_communication(cmd).await
    }

    async fn setup_process_communication(&mut self, mut process: Child) -> Result<()> {
        // Set up stdout reading for responses
        if let Some(stdout) = process.stdout.take() {
            let pending_requests = Arc::clone(&self.pending_requests);
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        // Try to parse as response
                        if let Ok(response) = serde_json::from_str::<PythonResponse>(&line) {
                            if let Ok(mut pending) = pending_requests.lock() {
                                if let Some(sender) = pending.remove(&response.id) {
                                    let _ = sender.send(response);
                                }
                            }
                        }
                        // Ignore startup messages and other non-response JSON
                    }
                }
            });
        }

        // Set up stderr reading for logging
        if let Some(stderr) = process.stderr.take() {
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        log::debug!("Python server: {}", line);
                    }
                }
            });
        }

        self.python_process = Some(process);

        // Wait for server to be ready
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        Ok(())
    }

    async fn send_request(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> Result<PythonResponse> {
        let process = self
            .python_process
            .as_ref()
            .ok_or_else(|| Error::InvalidConfig("No Python process".to_string()))?;

        let mut stdin = process
            .stdin
            .as_ref()
            .ok_or_else(|| Error::InvalidConfig("No stdin access".to_string()))?;

        let request_id = Uuid::new_v4().to_string();
        let request = PythonRequest {
            request_type: "request".to_string(),
            id: request_id.clone(),
            method: method.to_string(),
            params,
        };

        let (sender, receiver) = oneshot::channel();

        {
            let mut pending = self
                .pending_requests
                .lock()
                .map_err(|_| Error::InvalidConfig("Lock poisoned".to_string()))?;
            pending.insert(request_id.clone(), sender);
        }

        let request_json = serde_json::to_string(&request)
            .map_err(|e| Error::InvalidConfig(format!("JSON serialization failed: {}", e)))?;

        writeln!(stdin, "{}", request_json)
            .map_err(|e| Error::InvalidConfig(format!("Failed to write to stdin: {}", e)))?;

        stdin
            .flush()
            .map_err(|e| Error::InvalidConfig(format!("Failed to flush stdin: {}", e)))?;

        // Wait for response with timeout
        let response = tokio::time::timeout(tokio::time::Duration::from_secs(30), receiver)
            .await
            .map_err(|_| Error::InvalidConfig("Request timeout".to_string()))?
            .map_err(|_| Error::InvalidConfig("Request cancelled".to_string()))?;

        Ok(response)
    }

    async fn load_all(&self, network_path: &str, db_path: &PathBuf) -> Result<()> {
        let params = serde_json::json!({
            "file_path": network_path,
            "db_path": db_path.to_string_lossy()
        });

        let response = self.send_request("load_all", params).await?;

        if response.status != 200 {
            return Err(Error::InvalidConfig(
                response
                    .result
                    .get("error")
                    .and_then(|e| e.as_str())
                    .unwrap_or("Failed to load network and database")
                    .to_string(),
            ));
        }

        Ok(())
    }

    fn find_network_file(&self, project_path: &Path) -> Result<String> {
        let extensions = ["*.iidm", "*.xiidm", "*.jiidm"];

        for ext in &extensions {
            if let Ok(entries) = glob::glob(&project_path.join(ext).to_string_lossy()) {
                for entry in entries {
                    if let Ok(path) = entry {
                        return Ok(path.to_string_lossy().to_string());
                    }
                }
            }
        }

        Err(Error::InvalidConfig("No network file found".to_string()))
    }

    fn get_database_path(
        &self,
        project_path: &Path,
        project_name: &str,
        config: &ProjectConfig,
    ) -> PathBuf {
        let dir_project = project_path.join(&config.dir_project);
        dir_project.join(format!("{}.{}", project_name, config.ext_project))
    }

    pub fn get_network_path(&self) -> Option<&String> {
        self.network_path.as_ref()
    }
}

impl Drop for DatabaseManager {
    fn drop(&mut self) {
        self.disconnect();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use tempfile::TempDir;

    #[derive(Serialize, Deserialize, Debug, PartialEq)]
    struct TestRecord {
        id: i32,
        name: String,
        value: f64,
    }

    fn create_test_config() -> ProjectConfig {
        ProjectConfig {
            dir_project: "test_db".to_string(),
            ext_project: "duckdb".to_string(),
            key_project: "key_db".to_string(),
        }
    }

    fn setup_temp_dir() -> TempDir {
        tempfile::tempdir().expect("Failed to create temp directory")
    }

    #[tokio::test]
    async fn test_default_initialization() {
        let db_manager = DatabaseManager::default();
        assert!(!db_manager.is_connected());
    }

    #[tokio::test]
    async fn test_ping_when_not_connected() {
        let db_manager = DatabaseManager::default();
        let result = db_manager.ping().await.unwrap();
        assert!(!result);
    }

    #[tokio::test]
    async fn test_disconnect() {
        let mut db_manager = DatabaseManager::default();
        db_manager.disconnect();
        assert!(!db_manager.is_connected());
    }

    #[tokio::test]
    async fn test_error_when_not_connected() {
        let db_manager = DatabaseManager::default();

        let result = db_manager.execute_query("SELECT 1").await;
        assert!(result.is_err());

        match result.unwrap_err() {
            Error::InvalidConfig(msg) => {
                assert_eq!(msg, "No active connection");
            }
            _ => panic!("Expected InvalidConfig error"),
        }
    }

    #[tokio::test]
    async fn test_query_error_when_not_connected() {
        let db_manager = DatabaseManager::default();

        let result: Result<Vec<i32>> = db_manager.query("SELECT 1", |_| Ok(1)).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            Error::InvalidConfig(msg) => {
                assert_eq!(msg, "No active connection");
            }
            _ => panic!("Expected InvalidConfig error"),
        }
    }

    #[tokio::test]
    async fn test_get_database_path() {
        let temp_dir = setup_temp_dir();
        let db_manager = DatabaseManager::default();
        let config = create_test_config();

        let path = db_manager.get_database_path(temp_dir.path(), "my_project", &config);
        let expected = temp_dir.path().join("test_db").join("my_project.duckdb");

        assert_eq!(path, expected);
    }

    #[tokio::test]
    #[ignore = "requires python server and network file"]
    async fn test_connect_with_sidecar() {
        let mut db_manager = DatabaseManager::default();

        // Test connecting when sidecar is already running
        let result = db_manager.connect_with_sidecar().await;
        assert!(result.is_ok());
        assert!(db_manager.is_connected());
    }
}
