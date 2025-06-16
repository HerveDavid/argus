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
        self.sub_socket.setsockopt_string(zmq.SUBSCRIBE, "")
        
        # Attendre un peu pour que la connexion s'établisse
        await asyncio.sleep(0.1)
        
        self.logger.info(f"Client connecté au broker sur ports {self.pub_port} (PUB) et {self.sub_port} (SUB)")
        
    async def disconnect(self):
        """Ferme les connexions"""
        if self.pub_socket:
            self.pub_socket.close()
        if self.sub_socket:
            self.sub_socket.close()
        self.context.term()
        
    async def send_request(self, method, params=None, timeout=30):
        """Envoie une requête et attend la réponse
        
        Args:
            method: Nom de la méthode à appeler
            params: Paramètres de la méthode
            timeout: Timeout en secondes
            
        Returns:
            dict: Réponse du serveur
        """
        if params is None:
            params = {}
            
        request_id = str(uuid.uuid4())
        request = {
            "type": "request",
            "id": request_id,
            "method": method,
            "params": params
        }
        
        # Créer un future pour attendre la réponse
        response_future = asyncio.Future()
        self.pending_requests[request_id] = response_future
        
        try:
            # Envoyer la requête avec un topic
            message = f"powsybl.request {json.dumps(request)}"
            await self.pub_socket.send_string(message)
            self.logger.debug(f"Requête envoyée: {method} (ID: {request_id})")
            
            # Attendre la réponse avec timeout
            response = await asyncio.wait_for(response_future, timeout=timeout)
            return response
            
        except asyncio.TimeoutError:
            self.logger.error(f"Timeout pour la requête {method} (ID: {request_id})")
            raise
        finally:
            # Nettoyer
            self.pending_requests.pop(request_id, None)
    
    async def listen_for_responses(self):
        """Écoute les réponses du broker"""
        while True:
            try:
                # Vérifier s'il y a des messages
                if await self.sub_socket.poll(timeout=100, flags=zmq.POLLIN):
                    raw_message = await self.sub_socket.recv()
                    
                    try:
                        message_str = raw_message.decode('utf-8')
                        
                        # Gérer les messages avec topic
                        if ' ' in message_str and not message_str.startswith('{'):
                            parts = message_str.split(' ', 1)
                            if len(parts) == 2:
                                topic, json_payload = parts
                                
                                if topic == "powsybl.response":
                                    message = json.loads(json_payload)
                                elif topic == "network.heartbeat":
                                    continue  # Ignorer les heartbeats
                                else:
                                    continue  # Ignorer les autres topics
                            else:
                                continue
                        else:
                            # Message JSON direct
                            message = json.loads(message_str)
                    
                        # Vérifier si c'est une réponse
                        if message.get("type") == "response":
                            request_id = message.get("id")
                            if request_id in self.pending_requests:
                                future = self.pending_requests[request_id]
                                if not future.done():
                                    future.set_result(message)
                                self.logger.debug(f"Réponse reçue pour ID: {request_id}")
                            else:
                                self.logger.warning(f"Réponse reçue pour ID inconnu: {request_id}")
                        else:
                            self.logger.debug(f"Message non-réponse reçu: {message}")
                            
                    except (UnicodeDecodeError, json.JSONDecodeError) as e:
                        self.logger.debug(f"Message ignoré: {raw_message[:100]} - Erreur: {e}")
                        continue
                
                await asyncio.sleep(0.01)
                
            except Exception as e:
                self.logger.error(f"Erreur lors de l'écoute des réponses: {e}")
                await asyncio.sleep(1)


async def zmq_server(network_service, pub_port=10242, sub_port=10241):
    """Démarre le serveur ZMQ qui utilise le broker Rust
    
    Args:
        network_service: Instance du service réseau
        pub_port: Port pour publier vers le broker
        sub_port: Port pour recevoir du broker
    """
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
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
        
        # Démarrer l'écoute des réponses en arrière-plan
        listen_task = asyncio.create_task(client.listen_for_responses())
        
        # Boucle principale du serveur
        try:
            while running:
                # Vérifier s'il y a des messages de requête
                if await client.sub_socket.poll(timeout=100, flags=zmq.POLLIN):
                    try:
                        # Recevoir le message brut d'abord
                        raw_message = await client.sub_socket.recv()
                        
                        # Vérifier si le message n'est pas vide
                        if not raw_message:
                            logger.debug("Message vide reçu, ignoré")
                            continue
                            
                        # Essayer de décoder en JSON
                        try:
                            message_str = raw_message.decode('utf-8')
                            if not message_str.strip():
                                logger.debug("Message vide (après décodage), ignoré")
                                continue
                            
                            # Vérifier s'il y a un topic (format: "topic payload")
                            if ' ' in message_str and not message_str.startswith('{'):
                                # Séparer le topic du payload JSON
                                parts = message_str.split(' ', 1)
                                if len(parts) == 2:
                                    topic, json_payload = parts
                                    logger.debug(f"Message avec topic '{topic}' reçu")
                                    
                                    # Traiter selon le topic
                                    if topic == "network.heartbeat":
                                        logger.debug("Heartbeat reçu du broker")
                                        continue
                                    elif topic == "network.request":
                                        # C'est une vraie requête
                                        message = json.loads(json_payload)
                                    else:
                                        logger.debug(f"Topic '{topic}' ignoré")
                                        continue
                                else:
                                    logger.debug(f"Format de message non reconnu: {message_str[:100]}")
                                    continue
                            else:
                                # Message JSON direct sans topic
                                message = json.loads(message_str)
                                
                            logger.debug(f"Message JSON reçu: {str(message)[:100]}...")
                            
                        except (UnicodeDecodeError, json.JSONDecodeError) as e:
                            logger.debug(f"Message non-JSON ignoré: {raw_message[:100]} - Erreur: {e}")
                            continue
                        
                        # Vérifier si c'est une requête
                        if message.get("type") == "request":
                            try:
                                # Traiter le message
                                response = await handler.process_message(message)
                                
                                # Envoyer la réponse via le broker avec topic
                                response_message = f"powsybl.response {json.dumps(response)}"
                                await client.pub_socket.send_string(response_message)
                                logger.debug(f"Réponse envoyée pour requête ID: {message.get('id')}")
                                
                            except Exception as e:
                                # Gérer les erreurs de traitement
                                logger.error(f"Erreur lors du traitement de la requête: {str(e)}")
                                error_response = handler._create_error_response(
                                    message.get("id"), 500, f"Erreur serveur: {str(e)}"
                                )
                                error_message = f"powsybl.response {json.dumps(error_response)}"
                                await client.pub_socket.send_string(error_message)
                        else:
                            logger.debug(f"Message non-requête reçu (type: {message.get('type')}), ignoré")
                            
                    except Exception as e:
                        logger.error(f"Erreur lors de la réception du message: {str(e)}")
                        continue
                
                # Petite pause pour éviter le spinning CPU
                await asyncio.sleep(0.01)
                
        except Exception as e:
            logger.error(f"Erreur inattendue dans la boucle serveur: {str(e)}")
        finally:
            # Annuler la tâche d'écoute
            listen_task.cancel()
            try:
                await listen_task
            except asyncio.CancelledError:
                pass
                
    finally:
        logger.info("Fermeture du serveur ZMQ...")
        await client.disconnect()
        logger.info("Serveur ZMQ fermé avec succès")


# Reste du code inchangé pour la gestion stdin
def stdin_loop(network_service):
    """Gère les commandes depuis stdin pour l'arrêt gracieux."""
    print("[sidecar] En attente de commandes...", flush=True)
    
    loop = asyncio.new_event_loop()
    
    while True:
        # Lire l'entrée depuis stdin
        user_input = sys.stdin.readline().strip()
        
        # Vérifier si l'entrée correspond à une des fonctions disponibles
        match user_input:
            case "sidecar shutdown":
                print("[sidecar] Commande 'sidecar shutdown' reçue.", flush=True)
                # Arrêt gracieux du serveur ZMQ
                shutdown_server(loop)
                break
            case _:
                print(
                    f"[sidecar] Commande invalide [{user_input}]. Réessayez.", flush=True
                )
    
    loop.close()


def shutdown_server(loop):
    """Arrête le serveur de manière gracieuse."""
    # Envoyer un signal d'arrêt à toutes les tâches asyncio
    for task in asyncio.all_tasks(loop):
        task.cancel()
    
    # Arrêter la boucle d'événements
    loop.stop()
    
    # Définir un flag que le serveur doit s'arrêter
    global running
    running = False
    
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
        # Impossible de se connecter au broker
        return False
    except Exception as e:
        return False
    finally:
        if test_socket:
            test_socket.close()
        context.term()


# Fonction pour forcer la fermeture du port (Linux/Unix uniquement)
def force_close_port(port):
    """Force la fermeture d'un port en utilisant les commandes système (Linux/Unix uniquement)."""
    import os
    import platform

    if platform.system() == "Linux" or platform.system() == "Darwin":
        # Trouver le processus utilisant le port
        cmd = f"lsof -ti tcp:{port}"
        try:
            pids = os.popen(cmd).read().strip().split("\n")
            for pid in pids:
                if pid:
                    os.system(f"kill -9 {pid}")
            return True
        except:
            return False
    return False