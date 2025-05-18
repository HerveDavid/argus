use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::shared::utils::InsertExt;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct GameMasterOutput {
    pub id: String,

    #[serde(rename = "dynawo_id")]
    pub dynawo_id: String,

    pub topic: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub graphical_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub equipment_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub side: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none", rename = "componentType")]
    pub component_type: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
}

impl InsertExt for GameMasterOutput {
    async fn insert(&self, pool: &sqlx::Pool<sqlx::Sqlite>) -> Result<(), sqlx::Error> {
        sqlx::query(
            "
            INSERT INTO dynamo_game_master_outputs 
            (id, dynamo_id, topic, graphical_id, equipment_id, side, component_type, unit) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ",
        )
        .bind(&self.dynawo_id)
        .bind(&self.topic)
        .bind(&self.equipment_id)
        .bind(&self.side)
        .bind(&self.component_type)
        .bind(&self.unit)
        .execute(pool)
        .await?;

        Ok(())
    }
}

impl InsertExt for Vec<GameMasterOutput> {
    async fn insert(&self, pool: &sqlx::Pool<sqlx::Sqlite>) -> Result<(), sqlx::Error> {
        for output in self {
            output.insert(pool).await?;
        }

        Ok(())
    }
}
