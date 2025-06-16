import json
import logging
import zmq
import zmq.asyncio
import asyncio
import signal
import sys
import uuid
import base64
import os
from collections import defaultdict

# ========================================
# BROKER CLIENT SIMPLIFIÉ
# ========================================

class BrokerClient:
    """Client ZMQ simplifié pour communiquer avec le broker Rust"""
    
    def __init__(self, pub_port=10242, sub_port=10241):
        self.pub_port = pub_port
        self.sub_port = sub_port
        self.context = zmq.asyncio.Context()
        self.pub_socket = None
        self.sub_socket = None
        self.logger = logging.getLogger("broker")
        
    async def connect(self):
        """Connexion au broker"""
        self.pub_socket = self.context.socket(zmq.PUB)
        self.pub_socket.connect(f"tcp://localhost:{self.pub_port}")
        
        self.sub_socket = self.context.socket(zmq.SUB)
        self.sub_socket.connect(f"tcp://localhost:{self.sub_port}")
        self.sub_socket.setsockopt_string(zmq.SUBSCRIBE, "powsybl.request")
        
        await asyncio.sleep(0.1)  # Attendre la connexion
        self.logger.info(f"Connecté au broker (pub:{self.pub_port}, sub:{self.sub_port})")
        
    async def send_response(self, response):
        """Envoie une réponse via le broker"""
        message = f"powsybl.response {json.dumps(response)}"
        await self.pub_socket.send_string(message)
        
    async def receive_request(self, timeout=100):
        """Reçoit une requête du broker (ou None si timeout)"""
        if not await self.sub_socket.poll(timeout=timeout, flags=zmq.POLLIN):
            return None
            
        raw_message = await self.sub_socket.recv()
        message_str = raw_message.decode('utf-8')
        
        # Parse "topic payload"
        if ' ' not in message_str:
            return None
            
        topic, json_payload = message_str.split(' ', 1)
        if topic != "powsybl.request":
            return None
            
        return json.loads(json_payload)
        
    async def close(self):
        """Ferme les connexions"""
        if self.pub_socket:
            self.pub_socket.close()
        if self.sub_socket:
            self.sub_socket.close()
        self.context.term()

# ========================================
# HANDLER SIMPLIFIÉ
# ========================================

class SimpleHandler:
    """Handler simplifié pour traiter les requêtes"""
    
    def __init__(self, network_service):
        self.network_service = network_service
        self.logger = logging.getLogger("handler")
        
    async def process_request(self, request):
        """Traite une requête et retourne une réponse"""
        try:
            # Validation basique
            if not isinstance(request, dict) or request.get("type") != "request":
                return self._error_response(request.get("id"), 400, "Invalid request")
                
            method = request.get("method")
            params = request.get("params", {})
            request_id = request.get("id")
            
            if not method or not request_id:
                return self._error_response(request_id, 400, "Missing method or id")
                
            # Routage des méthodes
            handlers = {
                "upload_iidm": self._handle_upload,
                "get_network_json": self._handle_get_json,
                "get_current_network_info": self._handle_get_info,
                "get_single_line_diagram": self._handle_get_diagram,
                "get_single_line_diagram_metadata": self._handle_get_metadata,
                "get_network_substations": self._handle_get_substations,
                "get_network_voltage_levels": self._handle_get_voltage_levels,
                "get_voltage_levels_for_substation": self._handle_get_vl_for_substation
            }
            
            handler = handlers.get(method)
            if not handler:
                return self._error_response(request_id, 404, f"Unknown method: {method}")
                
            status, result = await handler(params)
            return {
                "type": "response",
                "id": request_id,
                "status": status,
                "result": result
            }
            
        except Exception as e:
            self.logger.error(f"Error processing request: {e}")
            return self._error_response(request.get("id"), 500, str(e))
    
    def _error_response(self, request_id, status, error):
        """Crée une réponse d'erreur"""
        return {
            "type": "response",
            "id": request_id or str(uuid.uuid4()),
            "status": status,
            "result": {"error": error}
        }
    
    # ========================================
    # HANDLERS DES MÉTHODES
    # ========================================
    
    async def _handle_upload(self, params):
        """Upload d'un fichier IIDM"""
        try:
            file_data = base64.b64decode(params["file_data"])
            filename = f"{uuid.uuid4().hex}.xiidm"
            filepath = os.path.join(self.network_service.UPLOAD_FOLDER, filename)
            
            with open(filepath, "wb") as f:
                f.write(file_data)
                
            error = await self.network_service.process_iidm_file(filepath)
            if error:
                os.remove(filepath)
                return 400, {"error": error}
                
            await self.network_service.cleanup_old_networks()
            return 201, {"status": "IIDM file loaded", "file_path": filepath}
            
        except Exception as e:
            return 500, {"error": str(e)}
    
    async def _handle_get_json(self, params):
        """Récupère le JSON du réseau"""
        if not self.network_service.current_network:
            return 404, {"error": "No network available"}
            
        json_content, error = await self.network_service.convert_network_to_json()
        if error:
            return 500, {"error": error}
            
        return 200, json_content
    
    async def _handle_get_info(self, params):
        """Récupère les infos du réseau actuel"""
        if not self.network_service.current_network:
            return 404, {"status": "No network loaded"}
            
        try:
            substations = self.network_service.current_network.get_substations()
            voltage_levels = self.network_service.current_network.get_voltage_levels()
            lines = self.network_service.current_network.get_lines()
            
            info = {
                "status": "Network loaded",
                "file_path": self.network_service.current_file_path,
                "filename": os.path.basename(self.network_service.current_file_path) if self.network_service.current_file_path else None,
                "substations_count": len(substations),
                "voltage_levels_count": len(voltage_levels),
                "lines_count": len(lines)
            }
            return 200, info
            
        except Exception as e:
            return 500, {"error": str(e)}
    
    async def _handle_get_diagram(self, params):
        """Génère un diagramme unifilaire"""
        element_id = params.get("id")
        if not element_id:
            return 400, {"error": "Element ID is required"}
            
        if not self.network_service.current_network:
            return 404, {"error": "No network available"}
            
        if not await self.network_service.element_exists(element_id):
            return 404, {"error": f"Element '{element_id}' not found"}
            
        svg_content, metadata = await self.network_service.generate_single_line_diagram(element_id)
        if svg_content is None:
            return 500, {"error": "Failed to generate diagram"}
            
        response_format = params.get("format", "svg")
        if response_format == "json":
            return 200, {"svg": svg_content, "metadata": metadata}
        else:
            return 200, {"content_type": "image/svg+xml", "svg": svg_content, "metadata": metadata}
    
    async def _handle_get_metadata(self, params):
        """Récupère les métadonnées d'un diagramme"""
        element_id = params.get("id")
        if not element_id:
            return 400, {"error": "Element ID is required"}
            
        if not self.network_service.current_network:
            return 404, {"error": "No network available"}
            
        if not await self.network_service.element_exists(element_id):
            return 404, {"error": f"Element '{element_id}' not found"}
            
        _, metadata = await self.network_service.generate_single_line_diagram(element_id)
        if metadata is None or "error" in metadata:
            return 500, {"error": "Failed to generate metadata"}
            
        return 200, metadata
    
    async def _handle_get_substations(self, params):
        """Récupère toutes les sous-stations"""
        if not self.network_service.current_network:
            return 404, {"error": "No network available"}
            
        substations_json, error = await self.network_service.get_substations()
        if error:
            return 500, {"error": error}
            
        return 200, substations_json
    
    async def _handle_get_voltage_levels(self, params):
        """Récupère tous les niveaux de tension"""
        if not self.network_service.current_network:
            return 404, {"error": "No network available"}
            
        voltage_levels_json, error = await self.network_service.get_voltage_levels()
        if error:
            return 500, {"error": error}
            
        return 200, voltage_levels_json
    
    async def _handle_get_vl_for_substation(self, params):
        """Récupère les niveaux de tension d'une sous-station"""
        substation_id = params.get("substation_id")
        if not substation_id:
            return 400, {"error": "Substation ID is required"}
            
        if not self.network_service.current_network:
            return 404, {"error": "No network available"}
            
        try:
            # Vérifier que la sous-station existe
            substations_df = self.network_service.current_network.get_substations()
            if substation_id not in substations_df.index:
                return 404, {"error": f"Substation '{substation_id}' not found"}
                
            # Récupérer les niveaux de tension
            voltage_levels_df = self.network_service.current_network.get_voltage_levels()
            vl_for_substation = voltage_levels_df[voltage_levels_df["substation_id"] == substation_id]
            
            result = {"substation_id": substation_id, "voltage_levels": []}
            
            for vl_id, vl in vl_for_substation.iterrows():
                vl_data = {
                    "id": vl_id,
                    "name": vl.get("name", ""),
                    "nominal_v": vl.get("nominal_v", 0),
                    "high_voltage_limit": vl.get("high_voltage_limit", 0),
                    "low_voltage_limit": vl.get("low_voltage_limit", 0),
                    "topology_kind": vl.get("topology_kind", "")
                }
                
                if "fictitious" in vl:
                    vl_data["fictitious"] = bool(vl["fictitious"])
                    
                result["voltage_levels"].append(vl_data)
                
            return 200, result
            
        except Exception as e:
            return 500, {"error": str(e)}

# ========================================
# SERVEUR PRINCIPAL
# ========================================

async def run_server(network_service, pub_port=10242, sub_port=10241):
    """Serveur principal simplifié"""
    # Configuration du logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    logger = logging.getLogger("server")
    
    # Initialisation
    client = BrokerClient(pub_port, sub_port)
    handler = SimpleHandler(network_service)
    
    try:
        await client.connect()
        
        # Charger le dernier réseau
        result = await network_service.load_last_network()
        if result:
            logger.warning(f"Impossible de charger le réseau précédent: {result}")
        else:
            logger.info("Réseau précédent chargé avec succès")
            
        await network_service.cleanup_old_networks(max_files=5)
        
        # Flag d'arrêt
        running = True
        
        def signal_handler(signum, frame):
            nonlocal running
            running = False
            logger.info("Signal d'arrêt reçu")
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        logger.info("Serveur démarré, en attente de requêtes...")
        
        # Boucle principale
        while running:
            try:
                # Recevoir une requête
                request = await client.receive_request(timeout=100)
                
                if request:
                    logger.info(f"Requête reçue: {request.get('method')} (ID: {request.get('id')})")
                    
                    # Traiter la requête
                    response = await handler.process_request(request)
                    
                    # Envoyer la réponse
                    await client.send_response(response)
                    logger.info(f"Réponse envoyée (ID: {response.get('id')})")
                
                await asyncio.sleep(0.01)  # Éviter le spinning CPU
                
            except Exception as e:
                logger.error(f"Erreur dans la boucle principale: {e}")
                continue
                
    except Exception as e:
        logger.error(f"Erreur fatale: {e}")
    finally:
        logger.info("Fermeture du serveur...")
        await client.close()
        logger.info("Serveur fermé")

# ========================================
# UTILITAIRES
# ========================================

async def test_send_request():
    """Envoie une requête de test"""
    context = zmq.asyncio.Context()
    test_socket = context.socket(zmq.PUB)
    
    try:
        test_socket.connect("tcp://localhost:10242")
        await asyncio.sleep(0.5)
        
        test_request = {
            "type": "request",
            "id": str(uuid.uuid4()),
            "method": "get_current_network_info",
            "params": {}
        }
        
        message = f"powsybl.request {json.dumps(test_request)}"
        await test_socket.send_string(message)
        print(f"Message de test envoyé: {test_request['method']}")
        
    except Exception as e:
        print(f"Erreur lors de l'envoi du test: {e}")
    finally:
        test_socket.close()
        context.term()

def start_server_with_stdin(network_service):
    """Démarre le serveur avec gestion des commandes stdin"""
    import threading
    
    def stdin_handler():
        print("[server] Commandes disponibles: 'shutdown', 'test'")
        while True:
            try:
                cmd = input().strip()
                if cmd == "shutdown":
                    print("[server] Arrêt demandé")
                    sys.exit(0)
                elif cmd == "test":
                    print("[server] Envoi d'un test...")
                    asyncio.run(test_send_request())
                else:
                    print(f"[server] Commande inconnue: {cmd}")
            except Exception as e:
                print(f"[server] Erreur: {e}")
    
    # Démarrer le thread stdin
    stdin_thread = threading.Thread(target=stdin_handler, daemon=True)
    stdin_thread.start()
    
    # Démarrer le serveur
    asyncio.run(run_server(network_service))