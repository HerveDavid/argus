use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Pool, Sqlite};

pub trait InsertExt {
    async fn insert(&self, pool: &Pool<Sqlite>) -> Result<(), sqlx::Error>;
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, FromRow)]
pub struct Substation {
    pub id: String,
    pub name: String,
    pub country: String,
    pub geo_tags: String,
    pub tso: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct Substations {
    pub substations: Vec<Substation>,
}

impl InsertExt for Vec<Substation> {
    async fn insert(&self, pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
        for substation in self {
            sqlx::query_as::<_, Substation>(
                "INSERT INTO substations (id, name, country, geo_tags, tag) 
                 VALUES (?, ?, ?, ?, ?)
                 RETURNING id, name, country, geo_tags, tag",
            )
            .bind(&substation.id)
            .bind(&substation.name)
            .bind(&substation.country)
            .bind(&substation.geo_tags)
            .fetch_optional(pool)
            .await?;
        }

        Ok(())
    }
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, FromRow)]
pub struct VoltageLevel {
    pub id: String,
    pub nominal_v: f64,
    pub topology_kind: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct VoltageLevels {
    pub voltage_levels: Vec<VoltageLevel>,
}

impl InsertExt for Vec<VoltageLevel> {
    async fn insert(&self, pool: &Pool<Sqlite>) -> Result<(), sqlx::Error> {
        for voltage_level in self {
            sqlx::query_as::<_, VoltageLevel>(
                "INSERT INTO voltage_levels (id, nominal_v, topology_kind) 
                 VALUES (?, ?, ?)
                 RETURNING id, nominal_v, topology_kind",
            )
            .bind(&voltage_level.id)
            .bind(&voltage_level.nominal_v)
            .bind(&voltage_level.topology_kind)
            .fetch_optional(pool)
            .await?;
        }

        Ok(())
    }
}
