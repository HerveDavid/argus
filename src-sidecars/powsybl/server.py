import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, Any

import pypowsybl as pp
import duckdb as db

from src.app.controllers.repository_controller import RepositoryController
from src.shared.request import Request
from src.shared.response import ResponseBuilder
from src.utils.logger import get_logger, LoggerConfig

# IMPORTANT: Tous les logs vont sur stderr, seul le JSON va sur stdout
logger = get_logger(__name__)


class RobustServer:
    def __init__(self):
        self.network_path: str = None
        self.db_path: str = None
        self.repository_controller: RepositoryController = None

        self.handlers = {
            "load_network": self.handle_load_network,
            "set_database": self.handle_set_database,
            "reset_database": self.handle_reset_database,
            "execute_query": self.handle_execute_query,
            "load_all": self.handle_load_all,
            "ping": self.handle_ping,  # Pour tester la connexion
        }

    def send_json(self, data: Dict[str, Any]):
        """Envoie du JSON pur sur stdout"""
        print(json.dumps(data), flush=True)

    def log_to_stderr(self, message: str):
        """Log sur stderr pour ne pas polluer stdout"""
        print(f"[SERVER] {message}", file=sys.stderr, flush=True)

    async def handle_ping(self, request: Request) -> Dict[str, Any]:
        """Handler pour tester la connexion"""
        return (
            ResponseBuilder()
            .with_id(request.id)
            .with_status(200)
            .with_result({"success": True, "message": "pong", "server_ready": True})
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

    async def start(self):
        """Start the server and process stdin"""
        self.log_to_stderr("Robust server started")

        # Send startup message - JSON PUR sur stdout
        startup_message = {
            "type": "startup",
            "message": "Server ready",
            "available_methods": list(self.handlers.keys()),
        }
        self.send_json(startup_message)

        try:
            async for line in self._read_stdin():
                line = line.strip()
                if not line:
                    continue

                try:
                    request_data = json.loads(line)
                    method = request_data.get("method")
                    request_id = request_data.get("id")

                    self.log_to_stderr(
                        f"Processing request: {method} (id: {request_id})"
                    )

                    response = await self.handle_request(request_data)
                    self.send_json(response)

                except json.JSONDecodeError as e:
                    self.log_to_stderr(f"Invalid JSON: {e}")
                    error_response = {
                        "type": "response",
                        "id": "json_error",
                        "status": 400,
                        "result": {"error": f"Invalid JSON: {str(e)}"},
                    }
                    self.send_json(error_response)

        except Exception as e:
            self.log_to_stderr(f"Server error: {e}")
        finally:
            self.log_to_stderr("EOF received, stopping server")
            if self.repository_controller:
                self.repository_controller.close()

    async def _read_stdin(self):
        """Async generator to read from stdin"""
        loop = asyncio.get_event_loop()
        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await loop.connect_read_pipe(lambda: protocol, sys.stdin)

        try:
            while True:
                line = await reader.readline()
                if not line:  # EOF
                    break
                yield line.decode("utf-8")
        except Exception as e:
            self.log_to_stderr(f"Error reading stdin: {e}")


async def main():
    try:
        # Setup logging - IMPORTANT: logs vont sur stderr
        LoggerConfig.setup_logging(
            level="INFO",
            log_file=None,  # Pas de fichier, logs sur stderr seulement
        )

        # Rediriger tous les logs vers stderr
        import logging

        root_logger = logging.getLogger()
        for handler in root_logger.handlers:
            handler.stream = sys.stderr

        # Create and start server
        server = RobustServer()
        await server.start()

    except Exception as e:
        # Erreur fatale sur stderr
        print(f"[SERVER] Fatal error: {e}", file=sys.stderr, flush=True)
        # Erreur JSON sur stdout
        error_response = {
            "type": "response",
            "id": "fatal_error",
            "status": 500,
            "result": {"error": f"Fatal server error: {str(e)}"},
        }
        print(json.dumps(error_response), flush=True)
        sys.exit(1)
    finally:
        print("[SERVER] Server stopped", file=sys.stderr, flush=True)


if __name__ == "__main__":
    asyncio.run(main())
