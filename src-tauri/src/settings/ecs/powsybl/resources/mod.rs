use bevy::prelude::*;
use serde::{Deserialize, Serialize};

use crate::settings::ecs::tokio::resource::AsyncRt;

use super::error::{Error, Result};

const ADDRESS: &str = "http://localhost:46728";

#[derive(Resource)]
pub struct PowsyblClient {
    client: reqwest::Client,
    base_url: String,
    handle: tokio::runtime::Handle,
}

impl FromWorld for PowsyblClient {
    fn from_world(world: &mut World) -> Self {
        let runtime = world.resource::<AsyncRt>();

        let client = reqwest::Client::new();
        let base_url = ADDRESS.to_string();
        let handle = runtime.handle.clone();

        Self {
            client,
            base_url,
            handle,
        }
    }
}

impl PowsyblClient {
    pub fn get<T>(&self, endpoint: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        self.handle
            .block_on(async { self.async_get(endpoint).await })
    }

    async fn async_get<T>(&self, endpoint: &str) -> Result<T>
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

    pub fn post<T, B>(&self, endpoint: &str, body: &B) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
        B: Serialize,
    {
        self.handle
            .block_on(async { self.async_post(endpoint, body).await })
    }

    async fn async_post<T, B>(&self, endpoint: &str, body: &B) -> Result<T>
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
}
