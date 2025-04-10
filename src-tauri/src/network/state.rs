use super::entities::{Substation, VoltageLevel};

use std::collections::HashMap;
use tokio::sync::broadcast;
use tokio::task::JoinHandle;

#[derive(Debug)]
pub struct SubscriptionHandle {
    pub handle: JoinHandle<()>,
    pub shutdown_sender: broadcast::Sender<()>,
}

#[derive(Debug, Default)]
pub struct NetworkState {
    pub substations: HashMap<String, Substation>,
    pub voltage_levels: HashMap<String, VoltageLevel>,
    pub ti_subscriptions: HashMap<String, SubscriptionHandle>,
}

impl NetworkState {
    // Méthode pour créer et ajouter une nouvelle tâche
    pub fn spawn_task<F>(&mut self, id: String, task_fn: F)
    where
        F: FnOnce(broadcast::Receiver<()>) -> JoinHandle<()>,
    {
        // Créer un canal de diffusion pour signaler l'arrêt
        let (shutdown_tx, shutdown_rx) = broadcast::channel(1);

        // Créer la tâche avec le récepteur du signal d'arrêt
        let handle = task_fn(shutdown_rx);

        // Stocker la tâche et son émetteur d'arrêt
        self.ti_subscriptions.insert(
            id,
            SubscriptionHandle {
                handle,
                shutdown_sender: shutdown_tx,
            },
        );
    }

    // Méthode pour arrêter une tâche
    pub fn stop_task(&mut self, id: &str) -> bool {
        if let Some(task) = self.ti_subscriptions.remove(id) {
            // Envoyer le signal d'arrêt
            let _ = task.shutdown_sender.send(());
            // Annuler la tâche pour être sûr
            task.handle.abort();
            true
        } else {
            false
        }
    }

    // Méthode pour vérifier si une tâche existe
    pub fn has_task(&self, id: &str) -> bool {
        self.ti_subscriptions.contains_key(id)
    }
}
