use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct RootConfig {
    pub name: String,
    pub source: String,
    pub configuration: Configuration,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Configuration {
    pub status: String,
    pub log_level: String,
    pub sections: Vec<String>,
    pub master: Master,
    pub hmi: Hmi,
    pub game_master: GameMaster,
    pub network: Network,
    pub source: String,
    #[serde(with = "custom_date_format")]
    pub loaded_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Master {
    pub period: u32,
    pub speedup: u32,
    pub dynawo_configured: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hmi {
    pub location: String,
    pub slider_count: u32,
    pub substations_count: u32,
    pub bool_buttons_count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameMaster {
    pub slider_count: u32,
    pub substations_count: u32,
    pub bool_buttons_count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Network {
    pub iidm_file_path: String,
    pub par_file_path: String,
    pub job_file_path: String,
    pub base_directory: Option<String>,
}

mod custom_date_format {
    use chrono::{DateTime, Utc, NaiveDateTime};
    use serde::{self, Deserialize, Deserializer, Serializer};

    const FORMAT: &str = "%Y-%m-%dT%H:%M:%S%.6f";

    pub fn serialize<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = format!("{}", date.format(FORMAT));
        serializer.serialize_str(&s)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        NaiveDateTime::parse_from_str(&s, FORMAT)
            .map(|dt| DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc))
            .map_err(serde::de::Error::custom)
    }
}