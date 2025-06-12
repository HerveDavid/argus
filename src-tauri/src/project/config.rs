pub struct ProjectConfig {
    pub key_project: String,
    pub dir_project: String,
    pub ext_project: String,
}

impl Default for ProjectConfig {
    fn default() -> Self {
        Self {
            key_project: "current-project".to_string(),
            dir_project: ".argus".to_string(),
            ext_project: "duckdb".to_string(),
        }
    }
}