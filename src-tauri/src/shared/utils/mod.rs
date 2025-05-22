use sqlx::{Error, Pool, Sqlite};

pub trait InsertExt {
    async fn insert(&self, pool: &Pool<Sqlite>) -> Result<(), Error>;
}

pub trait AssertExt {
    async fn assert(&self, pool: &Pool<Sqlite>) -> Result<(), Error>;
}
