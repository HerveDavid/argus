import sys
import asyncio
import logging
from domain.network import NetworkService
from interfaces import (
    zmq_server,
    start_stdin_thread,
    check_broker_connection,
)

# Ports du broker Rust
BROKER_PUB_PORT = 10241  # Port PUB du broker (on s'y connecte pour recevoir)
BROKER_SUB_PORT = 10242  # Port SUB du broker (on s'y connecte pour envoyer)

async def main():
    """Point d'entrée principal pour le serveur ZMQ avec le broker Rust."""
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger("main")
    
    # Vérifier si le broker Rust est accessible
    logger.info(f"Vérification de la connexion au broker Rust sur ports {BROKER_SUB_PORT}/{BROKER_PUB_PORT}...")
    
    if not await check_broker_connection(BROKER_SUB_PORT, BROKER_PUB_PORT):
        logger.error(f"Impossible de se connecter au broker Rust sur ports {BROKER_SUB_PORT}/{BROKER_PUB_PORT}")
        logger.error("Assurez-vous que le broker Rust est démarré avant ce client Python")
        logger.info("Le broker Rust doit être lancé avec les ports par défaut (PUB: 10241, SUB: 10242)")
        return
    
    logger.info("Connexion au broker Rust réussie ✓")
    
    # Créer le service réseau
    network_service = NetworkService()
    
    # Démarrer le thread pour les commandes stdin
    start_stdin_thread(network_service)
    
    # Démarrer le serveur ZMQ avec le broker
    logger.info("Démarrage du serveur ZMQ avec le broker Rust...")
    try:
        await zmq_server(
            network_service, 
            pub_port=BROKER_SUB_PORT,  # On publie vers le SUB du broker
            sub_port=BROKER_PUB_PORT   # On s'abonne au PUB du broker
        )
    except Exception as e:
        logger.error(f"Erreur lors du démarrage du serveur: {e}")
        import traceback
        logger.error(traceback.format_exc())
    finally:
        logger.info("Arrêt complet de l'application")
        sys.exit(0)


async def check_broker_and_start():
    """Vérifie périodiquement si le broker est disponible et démarre quand c'est le cas."""
    logger = logging.getLogger("broker_checker")
    
    max_retries = 10
    retry_delay = 2  # secondes
    
    for attempt in range(max_retries):
        logger.info(f"Tentative de connexion au broker ({attempt + 1}/{max_retries})...")
        
        if await check_broker_connection(BROKER_SUB_PORT, BROKER_PUB_PORT):
            logger.info("Broker détecté ! Démarrage du client...")
            await main()
            return
        
        logger.warning(f"Broker non disponible, nouvelle tentative dans {retry_delay}s...")
        await asyncio.sleep(retry_delay)
    
    logger.error(f"Impossible de se connecter au broker après {max_retries} tentatives")
    logger.error("Vérifiez que le broker Rust est démarré et accessible")


if __name__ == "__main__":
    try:
        # Option 1: Démarrage direct (si vous êtes sûr que le broker est déjà lancé)
        asyncio.run(main())
        
        # Option 2: Démarrage avec vérification périodique (décommentez si nécessaire)
        # asyncio.run(check_broker_and_start())
        
    except KeyboardInterrupt:
        print("\nArrêt gracieux du serveur...")
    except Exception as e:
        print(f"\nErreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # S'assurer que toutes les ressources ZMQ sont nettoyées
        import zmq
        try:
            zmq.Context().term()
        except:
            pass