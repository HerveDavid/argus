use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proxy {
    pub username: Option<String>,
    pub password: Option<String>,
    pub no_proxy: String,
    pub url: String,
}

impl Default for Proxy {
    fn default() -> Self {
        Self {
            username: None,
            password: None,
            no_proxy: "localhost".to_string(),
            url: "http://localhost".to_string(),
        }
    }
}
