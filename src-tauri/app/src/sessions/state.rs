use super::error::{Error, Result};

use tauri::AppHandle;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const ADDRESS: &str = "http://localhost:46728";

pub struct SessionState {
    client: Client,
    base_url: String,
}

impl SessionState {
    pub async fn new(_app_handle: &AppHandle) -> Result<tokio::sync::Mutex<Self>> {
        let client = Client::new();
        Ok(tokio::sync::Mutex::new(Self {
            client,
            base_url: ADDRESS.to_string(),
        }))
    }

    pub async fn get<T>(&self, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint.trim_start_matches('/'));

        let response = self.client
            .get(&url)
            .send()
            .await?;

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

    pub async fn post<T, B>(&self, endpoint: &str, body: &B) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
        B: Serialize,
    {
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint.trim_start_matches('/'));

        let response = self.client
            .post(&url)
            .json(body)
            .send()
            .await?;

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

    pub async fn post_empty<T>(&self, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint.trim_start_matches('/'));

        let response = self.client
            .post(&url)
            .send()
            .await?;

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

    pub async fn put<T, B>(&self, endpoint: &str, body: &B) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
        B: Serialize,
    {
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint.trim_start_matches('/'));

        let response = self.client
            .put(&url)
            .json(body)
            .send()
            .await?;

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

    pub async fn delete<T>(&self, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint.trim_start_matches('/'));

        let response = self.client
            .delete(&url)
            .send()
            .await?;

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

    pub async fn post_multipart<T>(&self, endpoint: &str, form: reqwest::multipart::Form) -> Result<T>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint.trim_start_matches('/'));

        let response = self.client
            .post(&url)
            .multipart(form)
            .send()
            .await?;

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

    pub async fn post_multipart_with_file<T>(
        &self,
        endpoint: &str,
        name: String,
        path: Option<String>,
        file_content: Vec<u8>,
        file_name: &str,
        base_directory: Option<String>
    ) -> Result<T>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let mut form = reqwest::multipart::Form::new()
            .text("name", name);

        if let Some(path_value) = path {
            form = form.text("path", path_value);
        }

        if let Some(base_dir) = base_directory {
            form = form.text("base_directory", base_dir);
        }

        let file_part = reqwest::multipart::Part::bytes(file_content)
            .file_name(file_name.to_string())
            .mime_str("application/octet-stream")
            .map_err(|_| Error::InvalidResponseFormat)?;

        form = form.part("file", file_part);

        self.post_multipart(endpoint, form).await
    }

    pub async fn post_form<T>(&self, endpoint: &str, form_data: std::collections::HashMap<String, String>) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url = format!("{}/{}", self.base_url.trim_end_matches('/'), endpoint.trim_start_matches('/'));

        let response = self.client
            .post(&url)
            .form(&form_data)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            return Err(Error::HttpError {
                status: status.as_u16(),
                message: format!("POST form request failed for {}", endpoint),
            });
        }

        let data = response
            .json::<T>()
            .await
            .map_err(|e| Error::JsonDeserialization(e.to_string()))?;

        Ok(data)
    }
}
