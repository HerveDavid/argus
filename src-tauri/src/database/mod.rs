use anyhow::Result;
use sqlx::{Pool, Sqlite, SqlitePool};
use tauri::{AppHandle, Manager};

pub struct DatabaseInner {
    pub pool: Pool<Sqlite>,
}

impl DatabaseInner {
    pub async fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("failed to get app dir");

        // Ensure the app directory exists
        std::fs::create_dir_all(&app_dir)?;

        let pool_path = app_dir.join("argus.db");

        // Set the DATABASE_URL environment variable to point to this SQLite files
        std::env::set_var("DATABASE_URL", format!("sqlite://{}", pool_path.display()));

        println!("-----------------------------------------------");
        println!("Setup argus database at: {:?}", pool_path);
        println!("-----------------------------------------------");

        let conn_options = sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&pool_path)
            .create_if_missing(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);

        let pool = SqlitePool::connect_with(conn_options).await?;

        // Run migrations regardless of whether the database is new
        // SQLx will track which migrations have been run
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }
}

pub type DatabaseState = tokio::sync::Mutex<DatabaseInner>;
