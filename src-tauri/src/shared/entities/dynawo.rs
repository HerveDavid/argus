use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::shared::utils::InsertExt;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
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
            INSERT INTO dynawo_game_master_outputs 
            (id, dynawo_id, topic, graphical_id, equipment_id, side, component_type, unit) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ",
        )
        .bind(&self.id) // $1: id
        .bind(&self.dynawo_id) // $2: dynawo_id
        .bind(&self.topic) // $3: topic
        .bind(&self.graphical_id) // $4: graphical_id
        .bind(&self.equipment_id) // $5: equipment_id
        .bind(&self.side) // $6: side
        .bind(&self.component_type) // $7: component_type
        .bind(&self.unit) // $8: unit
        .execute(pool)
        .await?;
        Ok(())
    }
}

use std::time::Instant;
use log::{debug, info, warn};

impl InsertExt for Vec<GameMasterOutput> {
    async fn insert(&self, pool: &sqlx::Pool<sqlx::Sqlite>) -> Result<(), sqlx::Error> {
        if self.is_empty() {
            info!("Aucun élément à insérer");
            return Ok(());
        }
        
        let start = Instant::now();
        info!("Début de l'insertion de {} éléments dans la table dynawo_game_master_outputs", self.len());
        
        // Commencer une transaction
        let mut tx = pool.begin().await?;
        debug!("Transaction démarrée");
        
        // Optimisations SQLite plus agressives
        info!("Application des optimisations SQLite pour insertion massive...");
        sqlx::query("PRAGMA synchronous = OFF").execute(&mut *tx).await?;
        sqlx::query("PRAGMA journal_mode = MEMORY").execute(&mut *tx).await?;
        sqlx::query("PRAGMA temp_store = MEMORY").execute(&mut *tx).await?;
        sqlx::query("PRAGMA cache_size = 10000").execute(&mut *tx).await?;
        sqlx::query("PRAGMA locking_mode = EXCLUSIVE").execute(&mut *tx).await?;
        debug!("Optimisations SQLite appliquées");
        
        // Taille du lot
        const BATCH_SIZE: usize = 1000;
        let total_batches = (self.len() + BATCH_SIZE - 1) / BATCH_SIZE;
        
        // Préparer l'instruction de base
        let base_query = "INSERT INTO dynawo_game_master_outputs 
                         (id, dynawo_id, topic, graphical_id, equipment_id, side, component_type, unit) VALUES ";
        
        // Log de progression
        let mut last_log_time = Instant::now();
        let log_interval = std::time::Duration::from_secs(2); // Log toutes les 2 secondes
        
        // Exécuter par lots avec une seule requête multi-valeurs par lot
        for (batch_index, chunk) in self.chunks(BATCH_SIZE).enumerate() {
            let batch_start = Instant::now();
            
            let mut query_str = String::from(base_query);
            
            // Construire les placeholders pour l'insertion multiple
            for i in 0..chunk.len() {
                if i > 0 {
                    query_str.push_str(", ");
                }
                query_str.push_str("(?,?,?,?,?,?,?,?)");
            }
            
            // Construire la requête avec tous les bindings
            let mut query = sqlx::query(&query_str);
            
            // Ajouter tous les bindings d'un coup
            for output in chunk {
                query = query
                    .bind(&output.id)
                    .bind(&output.dynawo_id)
                    .bind(&output.topic)
                    .bind(&output.graphical_id)
                    .bind(&output.equipment_id)
                    .bind(&output.side)
                    .bind(&output.component_type)
                    .bind(&output.unit);
            }
            
            // Exécuter la requête multi-valeurs
            query.execute(&mut *tx).await?;
            
            // Logs de progression espacés pour éviter de spammer le log
            let now = Instant::now();
            if now.duration_since(last_log_time) >= log_interval || batch_index == total_batches - 1 {
                let progress_percent = (batch_index + 1) as f64 * 100.0 / total_batches as f64;
                let batch_elapsed = batch_start.elapsed();
                let total_elapsed = start.elapsed();
                let avg_batch_time = total_elapsed.as_secs_f64() / (batch_index + 1) as f64;
                let remaining_batches = total_batches - (batch_index + 1);
                let estimated_remaining = avg_batch_time * remaining_batches as f64;
                
                info!("Progression: {:.1}% - Lot {}/{} ({} éléments) en {:?} - Vitesse: {:.0} éléments/sec, ETA: {:.1}s", 
                     progress_percent,
                     batch_index + 1, 
                     total_batches, 
                     chunk.len(),
                     batch_elapsed,
                     (batch_index + 1) * BATCH_SIZE as usize / total_elapsed.as_secs() as usize,
                     estimated_remaining);
                
                last_log_time = now;
            }
        }
        
        // Valider la transaction
        let commit_start = Instant::now();
        info!("Validation de la transaction...");
        tx.commit().await?;
        info!("Transaction validée en {:?}", commit_start.elapsed());
        
        let total_elapsed = start.elapsed();
        let items_per_second = self.len() as f64 / total_elapsed.as_secs_f64();
        
        info!("Insertion de {} éléments terminée en {:?} - Performance: {:.0} éléments/sec", 
             self.len(), total_elapsed, items_per_second);
        
        Ok(())
    }
}