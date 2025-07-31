from typing import Dict, Any

from src.shared.base_handler import BaseHandler
from src.shared.handler_type import Handlers, HandlerReturnType
from src.features.config.service import ConfigService


class ConfigController(BaseHandler):
    """Controller pour la gestion de la configuration"""

    def __init__(self, config_service: ConfigService = None):
        # Create ConfigService instance if not provided
        self._config_service = config_service or ConfigService()

    def get_handlers(self) -> Handlers:
        return {
            "load_config": self.load_config_handler,
            "get_config": self.get_config_handler,
            "list_config_files": self.list_config_files_handler,
            "validate_config": self.validate_config_handler,
            "reload_config": self.reload_config_handler,
            "get_job_iidm_file": self.get_job_iidm_file_handler,
            "parse_job_file": self.parse_job_file_handler,
        }

    async def load_config_handler(self, params: Dict[str, Any]) -> HandlerReturnType:
        """Handler pour charger une configuration"""
        try:
            file_path = params.get("file_path")
            if not file_path:
                return 400, {"error": "file_path parameter is required"}

            success = self._config_service.load_config(file_path)

            if not success:
                return 404, {
                    "error": f"Configuration file not found or invalid: {file_path}"
                }

            return 200, {
                "message": f"Configuration loaded from: {file_path}",
                "file_path": file_path,
                "config": self._config_service.get_config(),
            }

        except Exception as e:
            return 500, {"error": f"Unable to load config: {str(e)}"}

    async def reload_config_handler(self, params: Dict[str, Any]) -> HandlerReturnType:
        """Handler pour recharger la configuration actuelle"""
        try:
            if not self._config_service.is_loaded():
                return 400, {"error": "No configuration file currently loaded"}

            success = self._config_service.reload_config()

            if not success:
                return 500, {"error": "Failed to reload configuration"}

            return 200, {
                "message": "Configuration reloaded",
                "file_path": str(self._config_service.current_config_path),
                "config": self._config_service.get_config(),
            }

        except Exception as e:
            return 500, {"error": f"Unable to reload config: {str(e)}"}

    async def get_config_handler(self, params: Dict[str, Any]) -> HandlerReturnType:
        """Handler pour récupérer la configuration"""
        try:
            if not self._config_service.is_loaded():
                return 400, {"error": "No configuration loaded. Use load_config first."}

            section = params.get("section")
            key = params.get("key")

            if section and key:
                value = self._config_service.get_config_value(section, key)
                if value is None:
                    return 404, {
                        "error": f"Key '{key}' not found in section '{section}'"
                    }
                return 200, {"section": section, "key": key, "value": value}

            elif section:
                section_data = self._config_service.get_section(section)
                if not section_data:
                    return 404, {"error": f"Section '{section}' not found"}
                return 200, {"section": section, "data": section_data}

            else:
                return 200, {
                    "config": self._config_service.get_config(),
                    "file_path": str(self._config_service.current_config_path)
                    if self._config_service.current_config_path
                    else None,
                }

        except Exception as e:
            return 500, {"error": f"Unable to get config: {str(e)}"}

    async def list_config_files_handler(
        self, params: Dict[str, Any]
    ) -> HandlerReturnType:
        """Handler pour lister les fichiers de configuration disponibles"""
        try:
            directory = params.get("directory", ".")
            pattern = params.get("pattern", "*.toml")

            result = self._config_service.list_config_files(directory, pattern)

            if "error" in result:
                return 404, result

            return 200, result

        except Exception as e:
            return 500, {"error": f"Unable to list config files: {str(e)}"}

    async def validate_config_handler(
        self, params: Dict[str, Any]
    ) -> HandlerReturnType:
        """Handler pour valider la configuration"""
        try:
            if not self._config_service.is_loaded():
                return 400, {"error": "No configuration loaded. Use load_config first."}

            required_sections = params.get("required_sections")
            required_files = params.get("required_files")

            result = self._config_service.validate_config(
                required_sections, required_files
            )
            return 200, result

        except Exception as e:
            return 500, {"error": f"Unable to validate config: {str(e)}"}

    async def get_job_iidm_file_handler(
        self, params: Dict[str, Any]
    ) -> HandlerReturnType:
        """Handler pour récupérer le fichier IIDM depuis le job file"""
        try:
            if not self._config_service.is_loaded():
                return 400, {"error": "No configuration loaded. Use load_config first."}

            job_file_path = self._config_service.get_input_file_path("job_file")
            if not job_file_path or not job_file_path.exists():
                return 404, {
                    "error": "Job file not found in configuration or file doesn't exist"
                }

            iidm_file = self._config_service.get_iidm_file_from_job()
            if not iidm_file:
                return 404, {"error": "IIDM file not found in job file"}

            return 200, {
                "job_file": str(job_file_path),
                "iidm_file": iidm_file,
                "iidm_file_path": str(job_file_path.parent / iidm_file),
            }

        except Exception as e:
            return 500, {"error": f"Unable to get IIDM file from job: {str(e)}"}

    async def parse_job_file_handler(self, params: Dict[str, Any]) -> HandlerReturnType:
        """Handler pour parser complètement le fichier job"""
        try:
            if not self._config_service.is_loaded():
                return 400, {"error": "No configuration loaded. Use load_config first."}

            job_file_path = self._config_service.get_input_file_path("job_file")
            if not job_file_path or not job_file_path.exists():
                return 404, {
                    "error": "Job file not found in configuration or file doesn't exist"
                }

            job_data = self._config_service.parse_job_file()
            if not job_data:
                return 500, {"error": "Failed to parse job file"}

            return 200, {"job_file": str(job_file_path), "job_data": job_data}

        except Exception as e:
            return 500, {"error": f"Unable to parse job file: {str(e)}"}

    # Méthodes utilitaires pour compatibilité
    def load_config(self, file_path: str) -> bool:
        """Méthode publique pour charger une configuration"""
        return self._config_service.load_config(file_path)

    def get_config_value(self, section: str, key: str, default=None):
        """Récupère une valeur de configuration"""
        return self._config_service.get_config_value(section, key, default)

    def get_section(self, section: str) -> Dict[str, Any]:
        """Récupère une section complète de configuration"""
        return self._config_service.get_section(section)

    def has_section(self, section: str) -> bool:
        """Vérifie si une section existe"""
        return self._config_service.has_section(section)

    def has_key(self, section: str, key: str) -> bool:
        """Vérifie si une clé existe dans une section"""
        return self._config_service.has_key(section, key)

    def get_input_file_path(self, file_key: str):
        """Récupère le chemin complet d'un fichier d'entrée"""
        return self._config_service.get_input_file_path(file_key)

    def is_loaded(self) -> bool:
        """Vérifie si une configuration est chargée"""
        return self._config_service.is_loaded()

    def get_iidm_file_from_job(self):
        """Récupère le fichier IIDM depuis le job file"""
        return self._config_service.get_iidm_file_from_job()

    def get_iidm_file_path(self):
        """Récupère le chemin complet du fichier IIDM"""
        return self._config_service.get_iidm_file_path()

    @property
    def current_config_path(self):
        """Propriété pour compatibilité"""
        return self._config_service.current_config_path

    @property
    def config(self):
        """Propriété pour compatibilité"""
        return self._config_service.config
