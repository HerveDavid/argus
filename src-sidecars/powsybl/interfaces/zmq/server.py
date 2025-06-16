import json
import logging
import zmq
import zmq.asyncio
import asyncio
import signal
import sys
import threading
import uuid
from collections import defaultdict
from ..zmq.handler import ZmqHandler


class BrokerClient:
    """Client pour communiquer avec le broker Rust via ZMQ PUB/SUB"""
    
    def __init__(self, pub_port=10242, sub_port=10241):
        """Initialise le client broker
        
        Args:
            pub_port: Port pour publier des messages (se connecte au SUB du broker)
            sub_port: Port pour recevoir des messages (se connecte au PUB du broker)
        """
        self.pub_port = pub_port
        self.sub_port = sub_port
        self.context = zmq.asyncio.Context()
        self.pub_socket = None
        self.sub_socket = None
        self.pending_requests = {}
        self.logger = logging.getLogger("broker_client")
        
    async def connect(self):
        """Se connecte au broker Rust"""
        # Socket pour publier des messages (vers le SUB du broker)
        self.pub_socket = self.context.socket(zmq.PUB)
        self.pub_socket.connect(f"tcp://localhost:{self.pub_port}")
        
        # Socket pour recevoir des messages (depuis le PUB du broker)
        self.sub_socket = self.context.socket(zmq.SUB)
        self.sub_socket.connect(f"tcp://localhost:{self.sub_port}")
        
        # CORRECTION CRITIQUE: S'abonner UNIQUEMENT au topic powsybl.request
        self.sub_socket.setsockopt_string(zmq.SUBSCRIBE, "powsybl.request")
        
        # Attendre un peu pour que la connexion s'établisse
        await asyncio.sleep(0.1)
        
        self.logger.info(f"Client connecté au broker sur ports {self.pub_port} (PUB) et {self.sub_port} (SUB)")
        self.logger.info("Abonnement au topic 'powsybl.request' activé")
        
    async def disconnect(self):
        """Ferme les connexions"""
        if self.pub_socket:
            self.pub_socket.close()
        if self.sub_socket:
            self.sub_socket.close()
        self.context.term()


async def zmq_server(network_service, pub_port=10242, sub_port=10241):
    """Démarre le serveur ZMQ qui utilise le broker Rust
    
    Args:
        network_service: Instance du service réseau
        pub_port: Port pour publier vers le broker
        sub_port: Port pour recevoir du broker
    """
    # Configuration du logging
    logging.basicConfig(
        level=logging.DEBUG,  # Changé en DEBUG pour plus de verbosité
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger("powsybl")
    
    # Créer le client broker
    client = BrokerClient(pub_port, sub_port)
    
    try:
        await client.connect()
        
        # Créer le handler
        handler = ZmqHandler(network_service)
        
        logger.info(f"Serveur ZMQ démarré, connecté au broker sur ports {pub_port}/{sub_port}")
        
        # Charger le dernier réseau
        result = await network_service.load_last_network()
        if result:
            logger.warning(f"Impossible de charger le réseau précédent: {result}")
        else:
            logger.info("Réseau précédent chargé avec succès")
        
        # Nettoyer les anciens fichiers
        await network_service.cleanup_old_networks(max_files=5)
        
        # Flag pour contrôler la boucle principale
        running = True
        
        def signal_handler(signum, frame):
            nonlocal running
            running = False
            logger.info("Signal d'arrêt reçu, fermeture du serveur...")
        
        # Enregistrer les handlers de signaux
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        logger.info("Démarrage de la boucle d'écoute des requêtes Powsybl...")
        
        # Boucle principale du serveur - ÉCOUTE DIRECTE DES REQUÊTES
        try:
            while running:
                # Vérifier s'il y a des messages de requête
                if await client.sub_socket.poll(timeout=100, flags=zmq.POLLIN):
                    try:
                        # Recevoir le message brut
                        raw_message = await client.sub_socket.recv()
                        
                        if not raw_message:
                            logger.debug("Message vide reçu, ignoré")
                            continue
                            
                        try:
                            message_str = raw_message.decode('utf-8')
                            if not message_str.strip():
                                logger.debug("Message vide après décodage, ignoré")
                                continue
                            
                            logger.debug(f"Message brut reçu: {message_str[:200]}...")
                            
                            # Parser le message avec topic
                            if ' ' in message_str and not message_str.startswith('{'):
                                parts = message_str.split(' ', 1)
                                if len(parts) == 2:
                                    topic, json_payload = parts
                                    logger.debug(f"Topic: '{topic}', Payload: {json_payload[:100]}...")
                                    
                                    # CORRECTION: Ne traiter QUE les requêtes powsybl.request
                                    if topic == "powsybl.request":
                                        logger.info(f"Requête Powsybl reçue !")
                                        message = json.loads(json_payload)
                                    else:
                                        logger.debug(f"Topic '{topic}' ignoré (pas une requête Powsybl)")
                                        continue
                                else:
                                    logger.debug(f"Format de message invalide: {message_str[:100]}")
                                    continue
                            else:
                                # Message JSON direct sans topic (ne devrait pas arriver)
                                logger.debug("Message JSON direct reçu (format inattendu)")
                                message = json.loads(message_str)
                                
                            # Vérifier que c'est bien une requête
                            if message.get("type") == "request":
                                logger.info(f"Traitement de la requête: {message.get('method')} (ID: {message.get('id')})")
                                
                                try:
                                    # Traiter le message
                                    response = await handler.process_message(message)
                                    
                                    # Envoyer la réponse via le broker avec topic
                                    response_message = f"powsybl.response {json.dumps(response)}"
                                    await client.pub_socket.send_string(response_message)
                                    logger.info(f"Réponse envoyée pour requête ID: {message.get('id')}")
                                    
                                except Exception as e:
                                    # Gérer les erreurs de traitement
                                    logger.error(f"Erreur lors du traitement de la requête: {str(e)}")
                                    error_response = handler._create_error_response(
                                        message.get("id"), 500, f"Erreur serveur: {str(e)}"
                                    )
                                    error_message = f"powsybl.response {json.dumps(error_response)}"
                                    await client.pub_socket.send_string(error_message)
                            else:
                                logger.warning(f"Message reçu n'est pas une requête (type: {message.get('type')})")
                                
                        except (UnicodeDecodeError, json.JSONDecodeError) as e:
                            logger.error(f"Erreur de décodage du message: {e}")
                            logger.error(f"Message problématique: {raw_message[:100]}")
                            continue
                            
                    except Exception as e:
                        logger.error(f"Erreur lors de la réception du message: {str(e)}")
                        continue
                else:
                    # Aucun message reçu dans le timeout, c'est normal
                    pass
                
                # Petite pause pour éviter le spinning CPU
                await asyncio.sleep(0.01)
                
        except Exception as e:
            logger.error(f"Erreur inattendue dans la boucle serveur: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
                
    finally:
        logger.info("Fermeture du serveur ZMQ...")
        await client.disconnect()
        logger.info("Serveur ZMQ fermé avec succès")


# Fonction de test pour envoyer un message de test
async def test_send_request():
    """Fonction de test pour envoyer une requête de test"""
    logger = logging.getLogger("test")
    
    context = zmq.asyncio.Context()
    test_socket = context.socket(zmq.PUB)
    
    try:
        test_socket.connect("tcp://localhost:10242")
        await asyncio.sleep(0.5)  # Attendre que la connexion s'établisse
        
        test_request = {
            "type": "request",
            "id": str(uuid.uuid4()),
            "method": "get_current_network_info",
            "params": {}
        }
        
        message = f"powsybl.request {json.dumps(test_request)}"
        await test_socket.send_string(message)
        logger.info(f"Message de test envoyé: {test_request['method']}")
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du test: {e}")
    finally:
        test_socket.close()
        context.term()


# Reste du code inchangé
def stdin_loop(network_service):
    """Gère les commandes depuis stdin pour l'arrêt gracieux."""
    print("[sidecar] En attente de commandes...", flush=True)
    print("[sidecar] Tapez 'sidecar shutdown' pour arrêter", flush=True)
    print("[sidecar] Tapez 'test' pour envoyer un message de test", flush=True)
    
    loop = asyncio.new_event_loop()
    
    while True:
        try:
            # Lire l'entrée depuis stdin
            user_input = sys.stdin.readline().strip()
            
            # Vérifier si l'entrée correspond à une des fonctions disponibles
            match user_input:
                case "sidecar shutdown":
                    print("[sidecar] Commande 'sidecar shutdown' reçue.", flush=True)
                    shutdown_server(loop)
                    break
                case "test":
                    print("[sidecar] Envoi d'un message de test...", flush=True)
                    loop.run_until_complete(test_send_request())
                case _:
                    print(f"[sidecar] Commande invalide [{user_input}]. Réessayez.", flush=True)
        except Exception as e:
            print(f"[sidecar] Erreur: {e}", flush=True)
    
    loop.close()


def shutdown_server(loop):
    """Arrête le serveur de manière gracieuse."""
    print("[sidecar] Commande d'arrêt exécutée. Le serveur s'arrête...", flush=True)
    sys.exit(0)


def start_stdin_thread(network_service):
    """Démarre un thread pour gérer les commandes stdin."""
    try: 
        thread = threading.Thread(target=stdin_loop, args=(network_service,), daemon=True)
        thread.start()
    except:
        print("[sidecar] Échec du démarrage du gestionnaire d'entrée.", flush=True)


# Fonctions utilitaires pour vérifier les ports (adaptées pour le broker)
async def check_broker_connection(pub_port=10242, sub_port=10241):
    """Vérifie si le broker est accessible."""
    context = zmq.asyncio.Context()
    test_socket = None
    try:
        test_socket = context.socket(zmq.PUB)
        test_socket.connect(f"tcp://localhost:{pub_port}")
        
        # Attendre un court instant pour que la connexion s'établisse
        await asyncio.sleep(0.1)
        
        # Test simple de connexion - si on arrive ici sans erreur, c'est bon
        return True
        
    except zmq.error.ZMQError as e:
        return False
    except Exception as e:
        return False
    finally:
        if test_socket:
            test_socket.close()
        context.term()