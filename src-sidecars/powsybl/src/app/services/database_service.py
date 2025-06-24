import duckdb as db

from pathlib import Path
from typing import Optional
from abc import ABC, abstractmethod
from typing import Dict, Any

from src.app.controllers.repository_controller import RepositoryController
from src.app.services.network_service import NetworkService
from src.utils.logger import get_logger

logger = get_logger(__name__)

class DatabaseService(ABC):

    @abstractmethod
    def set_db_path(self, db_path: str) -> None:
        pass

    @abstractmethod
    def reset_database(self) -> None:
        pass

    @abstractmethod
    def execute_query(self, query: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def is_ready(self) -> bool:
        pass

class DatabaseServiceImpl(DatabaseService):

    def __init__(self, network_service: NetworkService):
        self._network_service = network_service
        self._db_path: Optional[str] = None
        self._conn: Optional[db.DuckDBPyConnection] = None
        self._repository_controller: Optional[RepositoryController] = None

    def set_db_path(self, db_path: str) -> None:
        try:
            # Fermer la connexion précédente si elle existe
            if self._conn:
                self._conn.close()

            # Créer le répertoire si nécessaire
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)

            self._db_path = db_path
            self._conn = db.connect(db_path)
            self._repository_controller = None

            logger.info(f"Database path set to: {db_path}")
        except Exception as e:
            logger.error(f"Failed to set database path: {e}")
            raise

    def reset_database(self) -> None:
        if not self._db_path:
            raise ValueError("No database path configured")

        if not self._network_service.is_loaded():
            raise ValueError("No network loaded")

        try:
            network_path = self._network_service.get_network_path()
            if not network_path:
                raise ValueError("Network path not available")

            # Réinitialiser le RepositoryController
            self._repository_controller = RepositoryController(
                network_path=network_path,
                db_path=self._db_path
            )

            # Initialiser tous les repositories
            self._repository_controller.initialize_all_repositories()

            logger.info("Database reset successfully")
        except Exception as e:
            logger.error(f"Failed to reset database: {e}")
            raise

    def execute_query(self, query: str) -> Dict[str, Any]:
        if not self._conn:
            raise ValueError("No database connection")

        try:
            result = self._conn.execute(query).fetchall()
            columns = [desc[0] for desc in self._conn.description] if self._conn.description else []

            # Convertir en format JSON-friendly
            data = []
            for row in result:
                row_dict = {}
                for i, value in enumerate(row):
                    col_name = columns[i] if i < len(columns) else f"col_{i}"
                    # Gérer les types non JSON-sérialisables
                    if hasattr(value, 'isoformat'):  # datetime
                        row_dict[col_name] = value.isoformat()
                    elif isinstance(value, (int, float, str, bool)) or value is None:
                        row_dict[col_name] = value
                    else:
                        row_dict[col_name] = str(value)
                data.append(row_dict)

            return {
                "columns": columns,
                "data": data,
                "row_count": len(data)
            }
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise

    def is_ready(self) -> bool:
        return (self._conn is not None and
                self._repository_controller is not None and
                self._network_service.is_loaded())

    def close(self) -> None:
        if self._repository_controller:
            self._repository_controller.close()
        if self._conn:
            self._conn.close()