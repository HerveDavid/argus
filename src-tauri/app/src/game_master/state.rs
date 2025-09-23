use super::error::{Error, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

const DEFAULT_ADDRESS: &str = "http://localhost:8000";

// API Models (unchanged)
#[derive(Debug, Serialize, Deserialize)]
pub struct SimulationConfig {
    #[serde(rename = "simulationName")]
    pub simulation_name: String,
    #[serde(rename = "startTime")]
    pub start_time: f64,
    #[serde(rename = "endTime")]
    pub end_time: f64,
    #[serde(rename = "timeStep")]
    pub time_step: f64,
    #[serde(rename = "currentStep")]
    pub current_step: f64,
    pub actions: Vec<Action>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Action {
    pub timestamp: f64,
    #[serde(rename = "actionType")]
    pub action_type: String,
    pub details: ActionDetails,
    pub interval_start: Option<f64>,
    pub interval_end: Option<f64>,
    pub law: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActionDetails {
    #[serde(rename = "elementId")]
    pub element_id: Option<ElementId>,
    pub percentage: Option<f64>,
    pub component_type: Option<String>,
    pub id: Option<String>,
    pub additional_params: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ElementId {
    Single(String),
    Multiple(Vec<String>),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStateUpdate {
    pub current_time: f64,
    pub state: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AggregateInput {
    pub current_time: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AggregateOutput {
    #[serde(rename = "simulationName")]
    pub simulation_name: String,
    #[serde(rename = "startTime")]
    pub start_time: f64,
    #[serde(rename = "endTime")]
    pub end_time: f64,
    #[serde(rename = "timeStep")]
    pub time_step: f64,
    #[serde(rename = "currentStep")]
    pub current_step: f64,
    pub actions: Vec<Action>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ControlInput {
    pub control_type: String,
    pub action: String,
    pub id: String,
    pub value: Option<f64>,
    pub timestamp: f64,
    pub interval_start: Option<f64>,
    pub interval_end: Option<f64>,
    pub law: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterControlInput {
    pub control_type: String,
    pub action: String,
    pub target: ClusterTarget,
    pub timestamp: f64,
    pub value: Option<f64>,
    pub interval_start: Option<f64>,
    pub interval_end: Option<f64>,
    pub law: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ClusterTarget {
    Static(Vec<String>),
    Dynamic(serde_json::Value),
}

// Response structs for URL management
#[derive(Debug, Serialize, Deserialize)]
pub struct GameMasterUrlResponse {
    pub url: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameMasterStatus {
    pub url: String,
    pub is_default: bool,
}

pub struct GameMasterState {
    client: Client,
    base_url: String,
}

impl GameMasterState {
    pub async fn new(_app_handle: &AppHandle) -> Result<tokio::sync::Mutex<Self>> {
        let client = Client::new();
        Ok(tokio::sync::Mutex::new(Self {
            client,
            base_url: DEFAULT_ADDRESS.to_string(),
        }))
    }

    // URL management methods
    pub fn set_url(&mut self, url: String) -> Result<GameMasterUrlResponse> {
        self.validate_url(&url)?;
        self.base_url = url.clone();

        Ok(GameMasterUrlResponse {
            url: url.clone(),
            message: format!("GameMaster URL set to {}", url),
        })
    }

    pub fn get_url(&self) -> GameMasterStatus {
        GameMasterStatus {
            url: self.base_url.clone(),
            is_default: self.base_url == DEFAULT_ADDRESS,
        }
    }

    fn validate_url(&self, url: &str) -> Result<()> {
        if url.trim().is_empty() {
            return Err(Error::InvalidAddress("URL cannot be empty".to_string()));
        }

        if !url.starts_with("http://") && !url.starts_with("https://") {
            return Err(Error::InvalidAddress(
                "URL must start with 'http://' or 'https://'".to_string(),
            ));
        }

        Ok(())
    }

    // Private HTTP methods (unchanged)
    async fn get<T>(&self, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            endpoint.trim_start_matches('/')
        );

        let response = self.client.get(&url).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("GET request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<T>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    async fn post<T, B>(&self, endpoint: &str, body: &B) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
        B: Serialize,
    {
        let url = format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            endpoint.trim_start_matches('/')
        );

        let response = self.client.post(&url).json(body).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("POST request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<T>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    async fn post_multipart<T>(&self, endpoint: &str, form: reqwest::multipart::Form) -> Result<T>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let url = format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            endpoint.trim_start_matches('/')
        );

        let response = self.client.post(&url).multipart(form).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("POST multipart request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<T>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    async fn put<T, B>(&self, endpoint: &str, body: &B) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
        B: Serialize,
    {
        let url = format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            endpoint.trim_start_matches('/')
        );

        let response = self.client.put(&url).json(body).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("PUT request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<T>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    async fn delete<T>(&self, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            endpoint.trim_start_matches('/')
        );

        let response = self.client.delete(&url).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("DELETE request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<T>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    async fn put_form_data(&self, endpoint: &str, form_data: &str) -> Result<serde_json::Value> {
        let url = format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            endpoint.trim_start_matches('/')
        );

        let response = self
            .client
            .put(&url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(form_data.to_owned())
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("PUT form data request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<serde_json::Value>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    async fn put_multipart<T>(&self, endpoint: &str, form: reqwest::multipart::Form) -> Result<T>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let url = format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            endpoint.trim_start_matches('/')
        );

        let response = self.client.put(&url).multipart(form).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("PUT multipart request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<T>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    // TRAINER endpoints (unchanged)
    pub async fn init_scenario(
        &self,
        dsl_file_content: Vec<u8>,
        simulation_name: Option<String>,
        artifact_id: Option<String>,
    ) -> Result<SimulationConfig> {
        let mut form = reqwest::multipart::Form::new();

        let file_part = reqwest::multipart::Part::bytes(dsl_file_content)
            .file_name("scenario.dsl")
            .mime_str("application/octet-stream")
            .map_err(|_| Error::InvalidResponseFormat)?;

        form = form.part("dsl_file", file_part);

        if let Some(name) = simulation_name {
            form = form.text("simulationName", name);
        }

        if let Some(id) = artifact_id {
            form = form.text("artifact_id", id);
        }

        self.post_multipart("trainer/init", form).await
    }

    pub async fn list_saved_simulations(&self) -> Result<serde_json::Value> {
        self.get("trainer/dsl/simulations").await
    }

    pub async fn list_saved_iidm(&self) -> Result<serde_json::Value> {
        self.get("trainer/iidm").await
    }

    pub async fn update_dsl(
        &self,
        simulation_name: String,
        dsl_file_content: Vec<u8>,
    ) -> Result<serde_json::Value> {
        let mut form = reqwest::multipart::Form::new();

        let file_part = reqwest::multipart::Part::bytes(dsl_file_content)
            .file_name("scenario.dsl")
            .mime_str("application/octet-stream")
            .map_err(|_| Error::InvalidResponseFormat)?;

        form = form.part("dsl_file", file_part);

        let endpoint = format!("trainer/dsl/{}", simulation_name);
        self.put_multipart(&endpoint, form).await
    }

    pub async fn delete_dsl(&self, simulation_name: String) -> Result<serde_json::Value> {
        let endpoint = format!("trainer/dsl/{}", simulation_name);
        self.delete(&endpoint).await
    }

    pub async fn trainer_update_system_state(
        &self,
        update: &SystemStateUpdate,
    ) -> Result<serde_json::Value> {
        self.post("trainer/system_state_update", update).await
    }

    pub async fn trainer_get_current_state(
        &self,
        start_time: Option<f64>,
        end_time: Option<f64>,
    ) -> Result<serde_json::Value> {
        let mut endpoint = "trainer/current".to_string();
        let mut params = Vec::new();

        if let Some(start) = start_time {
            params.push(format!("start_time={}", start));
        }

        if let Some(end) = end_time {
            params.push(format!("end_time={}", end));
        }

        if !params.is_empty() {
            endpoint.push('?');
            endpoint.push_str(&params.join("&"));
        }

        self.get(&endpoint).await
    }

    pub async fn get_dsl_file(&self, simulation_name: &str) -> Result<String> {
        let endpoint = format!("trainer/dsl/{}", simulation_name);

        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint);

        let response = self.client.get(&url).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("GET request failed for {}", endpoint),
            });
        }

        let text = response
            .text()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(text)
    }

    // SIMULATOR CONTROL endpoints (unchanged)
    pub async fn simulator_control(&self, input: &AggregateInput) -> Result<AggregateOutput> {
        self.post("sim/simulatorcontrol", input).await
    }

    pub async fn sim_update_system_state(
        &self,
        update: &SystemStateUpdate,
    ) -> Result<serde_json::Value> {
        self.post("sim/system_state_update", update).await
    }

    pub async fn simulator_control_v2(&self, input: &AggregateInput) -> Result<serde_json::Value> {
        self.post("sim/simulatorcontrol_v2", input).await
    }

    // USER CONTROL endpoints (unchanged)
    pub async fn user_control(&self, control: &ControlInput) -> Result<serde_json::Value> {
        self.put("user/control", control).await
    }

    pub async fn dsl_control(&self, control: &str) -> Result<serde_json::Value> {
        let endpoint = format!("user/control_dsl?control={}", urlencoding::encode(control));

        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint);

        let response = self.client.put(&url).send().await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("PUT request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<serde_json::Value>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }

    pub async fn cluster_control(
        &self,
        control: &ClusterControlInput,
    ) -> Result<serde_json::Value> {
        self.put("user/cluster_control", control).await
    }

    pub async fn user_get_current_state(&self) -> Result<serde_json::Value> {
        self.get("user/current").await
    }

    pub async fn get_pending_controls(&self) -> Result<serde_json::Value> {
        self.get("user/controls").await
    }

    pub async fn user_status(&self) -> Result<serde_json::Value> {
        self.get("user/status").await
    }

    // IIDM CONTROL endpoints (unchanged)
    pub async fn upload_iidm_file(
        &self,
        file_content: Vec<u8>,
        file_name: &str,
        artifact_id: Option<String>,
    ) -> Result<serde_json::Value> {
        let mut form = reqwest::multipart::Form::new();

        let file_part = reqwest::multipart::Part::bytes(file_content)
            .file_name(file_name.to_string())
            .mime_str("application/octet-stream")
            .map_err(|_| Error::InvalidResponseFormat)?;

        form = form.part("file", file_part);

        let mut endpoint = "iidm/iidm/upload".to_string();

        if let Some(id) = artifact_id {
            endpoint.push_str(&format!("?artifact_id={}", urlencoding::encode(&id)));
        }

        self.post_multipart(&endpoint, form).await
    }

    pub async fn get_iidm_properties(&self, file_id: &str) -> Result<serde_json::Value> {
        let endpoint = format!("iidm/iidm/properties/{}", file_id);
        self.get(&endpoint).await
    }

    // EVENT STORE endpoints (unchanged)
    pub async fn list_events(
        &self,
        status: Option<&str>,
        source: Option<&str>,
        time_spec: Option<&str>,
        simulation: Option<&str>,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<serde_json::Value> {
        let mut endpoint = "queue/list".to_string();
        let mut params = Vec::new();

        if let Some(s) = status {
            params.push(format!("status={}", urlencoding::encode(s)));
        }

        if let Some(s) = source {
            params.push(format!("source={}", urlencoding::encode(s)));
        }

        if let Some(ts) = time_spec {
            params.push(format!("time_spec={}", urlencoding::encode(ts)));
        }

        if let Some(sim) = simulation {
            params.push(format!("simulation={}", urlencoding::encode(sim)));
        }

        if let Some(l) = limit {
            params.push(format!("limit={}", l));
        }

        if let Some(o) = offset {
            params.push(format!("offset={}", o));
        }

        if !params.is_empty() {
            endpoint.push('?');
            endpoint.push_str(&params.join("&"));
        }

        self.get(&endpoint).await
    }

    pub async fn get_queue_summary(&self) -> Result<serde_json::Value> {
        self.get("queue/summary").await
    }

    pub async fn enqueue_next_step_dsl(&self, dsl: String) -> Result<serde_json::Value> {
        let mut form = reqwest::multipart::Form::new();
        form = form.text("dsl", dsl);

        self.post_multipart("atomic/rt-user_control_dsl", form)
            .await
    }
}
