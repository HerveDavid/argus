import asyncio
import json
import sys
import uuid
import signal
import zmq
import zmq.asyncio
import toml
import pypowsybl as pp
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Any, Optional
from pathlib import Path

from src.app.controllers.repository_controller import RepositoryController
from src.shared.request import Request
from src.shared.response import ResponseBuilder
from src.utils.logger import get_logger, LoggerConfig

logger = get_logger(__name__)


class Server:
    def __init__(
        self, client_id: str = None, pub_port: int = 10241, sub_port: int = 10242
    ):
        self.client_id = client_id or f"server_{uuid.uuid4().hex[:8]}"
        self.pub_port = pub_port
        self.sub_port = sub_port

        # ZMQ setup
        self.context = zmq.asyncio.Context()
        self.publisher = None
        self.subscriber = None

        # Server state
        self.network_path: str = None
        self.db_path: str = None
        self.repository_controller: RepositoryController = None
        self.running = False

        self.handlers = {
            "load_network": self.handle_load_network,
            "load_config": self.handle_load_config,
            "set_database": self.handle_set_database,
            "reset_database": self.handle_reset_database,
            "execute_query": self.handle_execute_query,
            "load_all": self.handle_load_all,
            "ping": self.handle_ping,
            "shutdown": self.handle_shutdown,
        }

    async def setup_zmq(self):
        """Configure les sockets ZMQ"""
        try:
            # Socket Publisher - se connecte au port SUB du broker
            self.publisher = self.context.socket(zmq.PUB)
            # connect() is NOT async - remove await
            self.publisher.connect(f"tcp://localhost:{self.sub_port}")

            # Socket Subscriber - se connecte au port PUB du broker
            self.subscriber = self.context.socket(zmq.SUB)
            # connect() is NOT async - remove await
            self.subscriber.connect(f"tcp://localhost:{self.pub_port}")

            # S'abonner aux messages pour ce client et aux broadcasts
            # setsockopt_string() is NOT async - remove await
            self.subscriber.setsockopt_string(zmq.SUBSCRIBE, f"{self.client_id}:")
            self.subscriber.setsockopt_string(zmq.SUBSCRIBE, "powsybl.request")

            # Attendre un peu pour que les connexions s'établissent
            await asyncio.sleep(0.1)

            self.log_to_stderr(f"ZMQ client '{self.client_id}' connected to broker")
            self.log_to_stderr(f"  - Publishing to: tcp://localhost:{self.sub_port}")
            self.log_to_stderr(f"  - Subscribing from: tcp://localhost:{self.pub_port}")

        except Exception as e:
            self.log_to_stderr(f"Error setting up ZMQ: {e}")
            raise

    async def cleanup_zmq(self):
        """Nettoie les ressources ZMQ"""
        try:
            if self.publisher:
                self.publisher.close()
            if self.subscriber:
                self.subscriber.close()
            if self.context:
                self.context.term()
            self.log_to_stderr("ZMQ resources cleaned up")
        except Exception as e:
            self.log_to_stderr(f"Error cleaning up ZMQ: {e}")

    async def send_message(self, topic: str, message: Dict[str, Any]):
        """Envoie un message via ZMQ"""
        try:
            message_str = json.dumps(message)
            full_message = f"{topic} {message_str}"
            # send_string() IS async when using zmq.asyncio
            await self.publisher.send_string(full_message)
            self.log_to_stderr(f"Sent message to topic '{topic}'")
        except Exception as e:
            self.log_to_stderr(f"Error sending message: {e}")

    async def receive_message(self) -> Optional[tuple]:
        """Reçoit un message via ZMQ (topic, message)"""
        try:
            # Use recv_string with NOBLOCK flag for non-blocking receive
            try:
                # recv_string() IS async when using zmq.asyncio
                raw_message = await self.subscriber.recv_string(zmq.NOBLOCK)
            except zmq.Again:
                return None

            # CORRECTION: Séparer le topic du message en utilisant l'espace, pas les deux-points
            # Format attendu: "topic message_json"
            if " " not in raw_message:
                self.log_to_stderr(f"Invalid message format: {raw_message}")
                return None

            topic, message_str = raw_message.split(" ", 1)  # Split sur le premier espace seulement
            message = json.loads(message_str)

            self.log_to_stderr(f"Received message from topic '{topic}': {message.get('method', 'unknown')}")
            return topic, message

        except json.JSONDecodeError as e:
            self.log_to_stderr(f"Error decoding JSON message: {e}")
            return None
        except Exception as e:
            self.log_to_stderr(f"Error receiving message: {e}")
            return None

    def log_to_stderr(self, message: str):
        """Log sur stderr pour ne pas polluer stdout"""
        print(f"[POWSYBL-{self.client_id}] {message}", file=sys.stderr, flush=True)

    async def handle_ping(self, request: Request) -> Dict[str, Any]:
        """Handler pour tester la connexion"""
        return (
            ResponseBuilder()
            .with_id(request.id)
            .with_status(200)
            .with_result(
                {
                    "success": True,
                    "message": "pong",
                    "server_ready": True,
                    "client_id": self.client_id,
                }
            )
            .build()
            .to_dict()
        )

    async def handle_shutdown(self, request: Request) -> Dict[str, Any]:
        """Handler pour arrêter le serveur"""
        self.running = False
        return (
            ResponseBuilder()
            .with_id(request.id)
            .with_status(200)
            .with_result(
                {
                    "success": True,
                    "message": "Server shutting down",
                    "client_id": self.client_id,
                }
            )
            .build()
            .to_dict()
        )

    async def handle_load_network(self, request: Request) -> Dict[str, Any]:
        """Charge un fichier réseau (IIDM/XIIDM/JIIDM)"""
        try:
            file_path = request.params.get("file_path")
            if not file_path:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("file_path parameter is required")
                    .build()
                    .to_dict()
                )

            if not Path(file_path).exists():
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(404)
                    .with_error(f"Network file not found: {file_path}")
                    .build()
                    .to_dict()
                )

            # Vérifier l'extension
            file_ext = Path(file_path).suffix.lower()
            if file_ext not in [".iidm", ".xiidm", ".jiidm"]:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error(
                        f"Unsupported file type: {file_ext}. Expected .iidm, .xiidm, or .jiidm"
                    )
                    .build()
                    .to_dict()
                )

            # Tester le chargement du réseau
            try:
                network = pp.network.load(file_path)
                self.network_path = file_path
                self.log_to_stderr(f"Network loaded successfully: {file_path}")

                # Infos basiques sur le réseau
                network_info = {
                    "file_path": file_path,
                    "network_id": network.id if hasattr(network, "id") else "unknown",
                    "buses_count": len(network.get_buses())
                    if hasattr(network, "get_buses")
                    else 0,
                    "lines_count": len(network.get_lines())
                    if hasattr(network, "get_lines")
                    else 0,
                    "generators_count": len(network.get_generators())
                    if hasattr(network, "get_generators")
                    else 0,
                    "loads_count": len(network.get_loads())
                    if hasattr(network, "get_loads")
                    else 0,
                }

                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(200)
                    .with_result(
                        {
                            "success": True,
                            "message": "Network loaded successfully",
                            "network_info": network_info,
                        }
                    )
                    .build()
                    .to_dict()
                )

            except Exception as e:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error(f"Failed to load network: {str(e)}")
                    .build()
                    .to_dict()
                )

        except Exception as e:
            self.log_to_stderr(f"Error in load_network: {e}")
            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(500)
                .with_error(str(e))
                .build()
                .to_dict()
            )

    async def handle_load_config(self, request: Request) -> Dict[str, Any]:
        """Charge un fichier de configuration TOML et extrait le fichier IIDM du job file"""
        try:
            config_path = request.params.get("config_path")
            if not config_path:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("config_path parameter is required")
                    .build()
                    .to_dict()
                )

            if not Path(config_path).exists():
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(404)
                    .with_error(f"Config file not found: {config_path}")
                    .build()
                    .to_dict()
                )

            # Charger le fichier TOML
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = toml.load(f)
            except Exception as e:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error(f"Failed to parse TOML config: {str(e)}")
                    .build()
                    .to_dict()
                )

            # Extraire le job_file de la configuration
            job_file = config.get("input_files", {}).get("job_file")
            if not job_file:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("job_file not found in config [input_files] section")
                    .build()
                    .to_dict()
                )

            # Construire le chemin absolu du job file (relatif au dossier du config)
            config_dir = Path(config_path).parent
            job_file_path = config_dir / job_file

            if not job_file_path.exists():
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(404)
                    .with_error(f"Job file not found: {job_file_path}")
                    .build()
                    .to_dict()
                )

            # Parser le fichier XML jobs
            try:
                tree = ET.parse(job_file_path)
                root = tree.getroot()
                
                # Chercher l'élément network avec l'attribut iidmFile
                # Namespace pour dynawo
                ns = {'dynawo': 'http://www.rte-france.com/dynawo'}
                network_elem = root.find('.//dynawo:network[@iidmFile]', ns)
                
                if network_elem is None:
                    # Essayer sans namespace au cas où
                    network_elem = root.find('.//network[@iidmFile]')
                
                if network_elem is None:
                    return (
                        ResponseBuilder()
                        .with_id(request.id)
                        .with_status(400)
                        .with_error("No network element with iidmFile attribute found in job file")
                        .build()
                        .to_dict()
                    )

                iidm_file = network_elem.get('iidmFile')
                if not iidm_file:
                    return (
                        ResponseBuilder()
                        .with_id(request.id)
                        .with_status(400)
                        .with_error("iidmFile attribute is empty")
                        .build()
                        .to_dict()
                    )

                # Construire le chemin absolu du fichier IIDM (relatif au dossier du config)
                iidm_file_path = config_dir / iidm_file

                if not iidm_file_path.exists():
                    return (
                        ResponseBuilder()
                        .with_id(request.id)
                        .with_status(404)
                        .with_error(f"IIDM file not found: {iidm_file_path}")
                        .build()
                        .to_dict()
                    )

                # Charger automatiquement le réseau
                load_request = Request(
                    "load_network", 
                    {"file_path": str(iidm_file_path)}, 
                    f"{request.id}_load_network"
                )
                load_result = await self.handle_load_network(load_request)

                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(200)
                    .with_result(
                        {
                            "success": True,
                            "message": "Configuration loaded and network loaded successfully",
                            "config_path": config_path,
                            "job_file": str(job_file_path),
                            "iidm_file": str(iidm_file_path),
                            "config": config,
                            "network_load_result": load_result["result"] if load_result["status"] == 200 else None,
                            "network_load_error": load_result.get("error") if load_result["status"] != 200 else None
                        }
                    )
                    .build()
                    .to_dict()
                )

            except ET.ParseError as e:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error(f"Failed to parse XML job file: {str(e)}")
                    .build()
                    .to_dict()
                )

        except Exception as e:
            self.log_to_stderr(f"Error in load_config: {e}")
            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(500)
                .with_error(str(e))
                .build()
                .to_dict()
        )

    async def handle_set_database(self, request: Request) -> Dict[str, Any]:
        """Configure le chemin de la base de données"""
        try:
            db_path = request.params.get("db_path")
            if not db_path:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("db_path parameter is required")
                    .build()
                    .to_dict()
                )

            self.db_path = db_path
            # Créer le répertoire si nécessaire
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)

            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(200)
                .with_result(
                    {
                        "success": True,
                        "message": "Database path configured",
                        "db_path": db_path,
                    }
                )
                .build()
                .to_dict()
            )

        except Exception as e:
            self.log_to_stderr(f"Error in set_database: {e}")
            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(500)
                .with_error(str(e))
                .build()
                .to_dict()
            )

    async def handle_reset_database(self, request: Request) -> Dict[str, Any]:
        """Recrée la base de données avec toutes les tables"""
        try:
            if not self.network_path:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("No network loaded. Use load_network first.")
                    .build()
                    .to_dict()
                )

            if not self.db_path:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("No database path configured. Use set_database first.")
                    .build()
                    .to_dict()
                )

            # Créer le RepositoryController
            self.repository_controller = RepositoryController(
                network_path=self.network_path, db_path=self.db_path
            )

            # Initialiser toutes les tables
            self.repository_controller.initialize_all_repositories()

            self.log_to_stderr("Database reset completed successfully")

            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(200)
                .with_result(
                    {
                        "success": True,
                        "message": "Database reset completed successfully",
                        "network_path": self.network_path,
                        "db_path": self.db_path,
                    }
                )
                .build()
                .to_dict()
            )

        except Exception as e:
            self.log_to_stderr(f"Error in reset_database: {e}")
            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(500)
                .with_error(str(e))
                .build()
                .to_dict()
            )

    async def handle_execute_query(self, request: Request) -> Dict[str, Any]:
        """Exécute une requête SQL"""
        try:
            if not self.repository_controller:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("Database not initialized. Use reset_database first.")
                    .build()
                    .to_dict()
                )

            query = request.params.get("query")
            if not query:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("query parameter is required")
                    .build()
                    .to_dict()
                )

            # Utiliser la connexion du repository controller
            conn = self.repository_controller._conn
            result = conn.execute(query).fetchall()
            columns = [desc[0] for desc in conn.description] if conn.description else []

            # Convertir en format JSON-friendly
            data = []
            for row in result:
                row_dict = {}
                for i, value in enumerate(row):
                    col_name = columns[i] if i < len(columns) else f"col_{i}"
                    # Gérer les types non JSON-sérialisables
                    if hasattr(value, "isoformat"):  # datetime
                        row_dict[col_name] = value.isoformat()
                    elif isinstance(value, (int, float, str, bool)) or value is None:
                        row_dict[col_name] = value
                    else:
                        row_dict[col_name] = str(value)
                data.append(row_dict)

            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(200)
                .with_result(
                    {
                        "success": True,
                        "columns": columns,
                        "data": data,
                        "row_count": len(data),
                    }
                )
                .build()
                .to_dict()
            )

        except Exception as e:
            self.log_to_stderr(f"Error in execute_query: {e}")
            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(500)
                .with_error(str(e))
                .build()
                .to_dict()
            )

    async def handle_load_all(self, request: Request) -> Dict[str, Any]:
        """Charge tout en une fois : réseau + base de données"""
        try:
            file_path = request.params.get("file_path")
            db_path = request.params.get("db_path", "network.db")

            if not file_path:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(400)
                    .with_error("file_path parameter is required")
                    .build()
                    .to_dict()
                )

            # 1. Charger le réseau
            network_request = Request(
                "load_network", {"file_path": file_path}, f"{request.id}_network"
            )
            network_result = await self.handle_load_network(network_request)

            if network_result["status"] != 200:
                return network_result

            # 2. Configurer la base de données
            db_request = Request(
                "set_database", {"db_path": db_path}, f"{request.id}_db"
            )
            db_result = await self.handle_set_database(db_request)

            if db_result["status"] != 200:
                return db_result

            # 3. Réinitialiser la base de données
            reset_request = Request("reset_database", {}, f"{request.id}_reset")
            reset_result = await self.handle_reset_database(reset_request)

            if reset_result["status"] != 200:
                return reset_result

            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(200)
                .with_result(
                    {
                        "success": True,
                        "message": "Network and database loaded successfully",
                        "network_path": self.network_path,
                        "db_path": self.db_path,
                        "network_info": network_result["result"]["network_info"],
                    }
                )
                .build()
                .to_dict()
            )

        except Exception as e:
            self.log_to_stderr(f"Error in load_all: {e}")
            return (
                ResponseBuilder()
                .with_id(request.id)
                .with_status(500)
                .with_error(str(e))
                .build()
                .to_dict()
            )

    async def handle_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming requests"""
        try:
            request = Request(
                method=request_data.get("method"),
                params=request_data.get("params", {}),
                id=request_data.get("id"),
            )

            handler = self.handlers.get(request.method)
            if not handler:
                return (
                    ResponseBuilder()
                    .with_id(request.id)
                    .with_status(404)
                    .with_error(f"Method not found: {request.method}")
                    .build()
                    .to_dict()
                )

            return await handler(request)

        except Exception as e:
            self.log_to_stderr(f"Error handling request: {e}")
            return (
                ResponseBuilder()
                .with_id(request_data.get("id", "unknown"))
                .with_status(500)
                .with_error(str(e))
                .build()
                .to_dict()
            )

    async def announce_startup(self):
        """Annonce que le serveur est prêt"""
        startup_message = {
            "type": "startup",
            "client_id": self.client_id,
            "message": "Server ready",
            "available_methods": list(self.handlers.keys()),
        }
        await self.send_message("powsybl.response", startup_message)

    async def run(self):
        """Boucle principale du serveur ZMQ"""
        self.running = True

        try:
            await self.setup_zmq()
            await self.announce_startup()

            self.log_to_stderr("ZMQ server started, waiting for messages...")

            while self.running:
                # Vérifier les messages ZMQ
                result = await self.receive_message()
                if result:
                    topic, message_data = result

                    # Ignorer nos propres messages broadcast
                    if (
                        topic == "powsybl.response"
                        and message_data.get("client_id") == self.client_id
                    ):
                        continue

                    # CORRECTION: Traiter aussi les requêtes sur le topic powsybl.request
                    if topic == self.client_id or topic == "powsybl.request":
                        self.log_to_stderr(
                            f"Processing request: {message_data.get('method')} from topic: {topic}"
                        )
                        response = await self.handle_request(message_data)

                        # CORRECTION: Toujours envoyer la réponse sur powsybl.response
                        await self.send_message("powsybl.response", response)

                # Petite pause pour éviter de consommer trop de CPU
                await asyncio.sleep(0.001)

        except Exception as e:
            self.log_to_stderr(f"Error in main loop: {e}")
        finally:
            await self.cleanup_zmq()
            if self.repository_controller:
                self.repository_controller.close()

    def setup_signal_handlers(self):
        """Configure les gestionnaires de signaux pour un arrêt propre"""

        def signal_handler(signum, frame):
            self.log_to_stderr(f"Received signal {signum}, shutting down...")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)


async def main():
    """Point d'entrée principal"""
    try:
        LoggerConfig.setup_logging(
            level="INFO",
            log_file=None,
        )

        import logging

        root_logger = logging.getLogger()
        for handler in root_logger.handlers:
            handler.stream = sys.stderr

        # Récupérer les paramètres de la ligne de commande
        client_id = sys.argv[1] if len(sys.argv) > 1 else None
        pub_port = int(sys.argv[2]) if len(sys.argv) > 2 else 10241
        sub_port = int(sys.argv[3]) if len(sys.argv) > 3 else 10242

        # Créer et démarrer le serveur
        server = Server(client_id=client_id, pub_port=pub_port, sub_port=sub_port)
        server.setup_signal_handlers()

        await server.run()

    except Exception as e:
        # Erreur fatale sur stderr
        print(f"[POWSYBL] Fatal error: {e}", file=sys.stderr, flush=True)
        sys.exit(1)
    finally:
        print("[POWSYBL] Server stopped", file=sys.stderr, flush=True)


if __name__ == "__main__":
    asyncio.run(main())
