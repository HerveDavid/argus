from pathlib import Path
from abc import ABC, abstractmethod
from typing import Dict, Any

from src.app.services.configuration_service import ConfigurationService
from src.app.services.database_service import DatabaseService
from src.app.services.network_service import NetworkService
from src.utils.logger import get_logger

logger = get_logger(__name__)

class ApplicationService(ABC):

    @abstractmethod
    async def set_config(self, file_path: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def set_database(self, db_path: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def reset_database(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def execute_query(self, query: str) -> Dict[str, Any]:
        pass


class ApplicationServiceImpl(ApplicationService):
    """Service principal orchestrant tous les autres"""

    def __init__(self,
                 config_service: ConfigurationService,
                 network_service: NetworkService,
                 database_service: DatabaseService):
        self._config_service = config_service
        self._network_service = network_service
        self._database_service = database_service

    async def set_config(self, file_path: str) -> Dict[str, Any]:
        try:
            if not Path(file_path).exists():
                return {
                    "success": False,
                    "error": f"Configuration file not found: {file_path}"
                }

            # Charger la configuration
            success = self._config_service.load_config(file_path)
            if not success:
                return {
                    "success": False,
                    "error": "Failed to load configuration"
                }

            # Charger le réseau depuis la configuration
            iidm_path = self._config_service.get_iidm_file_path()
            if not iidm_path:
                return {
                    "success": False,
                    "error": "No IIDM file path found in configuration"
                }

            network_loaded = self._network_service.load_network(iidm_path)

            return {
                "success": True,
                "config_loaded": True,
                "network_loaded": network_loaded,
                "iidm_path": iidm_path
            }
        except Exception as e:
            logger.error(f"Error setting config: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def set_database(self, db_path: str) -> Dict[str, Any]:
        try:
            self._database_service.set_db_path(db_path)
            return {
                "success": True,
                "database_path": db_path
            }
        except Exception as e:
            logger.error(f"Error setting database: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def reset_database(self) -> Dict[str, Any]:
        try:
            if not self._config_service.is_loaded():
                return {
                    "success": False,
                    "error": "No configuration loaded. Use set_config first."
                }

            self._database_service.reset_database()
            return {
                "success": True,
                "message": "Database reset successfully"
            }
        except Exception as e:
            logger.error(f"Error resetting database: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def execute_query(self, query: str) -> Dict[str, Any]:
        try:
            if not self._database_service.is_ready():
                return {
                    "success": False,
                    "error": "Database not ready. Use set_config and reset_database first."
                }

            result = self._database_service.execute_query(query)
            return {
                "success": True,
                **result
            }
        except Exception as e:
            logger.error(f"Error executing query: {e}")
            return {
                "success": False,
                "error": str(e)
            }
