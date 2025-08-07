import toml
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

from src.utils.logger import get_logger

logger = get_logger(__name__)


class ConfigService:
    """Service pour la gestion de la configuration"""

    def __init__(self):
        self.current_config_path: Optional[Path] = None
        self.config: Dict[str, Any] = {}

    def load_config(self, file_path: str) -> bool:
        """Charge une configuration depuis un fichier"""
        try:
            config_path = Path(file_path)
            if not config_path.exists():
                logger.error(f"Configuration file not found: {file_path}")
                return False

            self.current_config_path = config_path
            self.config = self._load_config_from_file(config_path)
            logger.info(f"Configuration loaded successfully from: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to load configuration: {str(e)}")
            return False

    def reload_config(self) -> bool:
        """Recharge la configuration actuelle"""
        if not self.current_config_path:
            logger.error("No configuration file currently loaded")
            return False

        try:
            self.config = self._load_config_from_file(self.current_config_path)
            logger.info("Configuration reloaded successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to reload configuration: {str(e)}")
            return False

    def get_config(self, section: Optional[str] = None, key: Optional[str] = None) -> Any:
        """Récupère la configuration complète ou une partie spécifique"""
        if not self.config:
            return None

        if section and key:
            return self.config.get(section, {}).get(key)
        elif section:
            return self.config.get(section)
        else:
            return self.config

    def get_config_value(self, section: str, key: str, default=None):
        """Récupère une valeur de configuration"""
        return self.config.get(section, {}).get(key, default)

    def get_section(self, section: str) -> Dict[str, Any]:
        """Récupère une section complète de configuration"""
        return self.config.get(section, {})

    def has_section(self, section: str) -> bool:
        """Vérifie si une section existe"""
        return section in self.config

    def has_key(self, section: str, key: str) -> bool:
        """Vérifie si une clé existe dans une section"""
        return section in self.config and key in self.config[section]

    def get_input_file_path(self, file_key: str) -> Optional[Path]:
        """Récupère le chemin complet d'un fichier d'entrée"""
        if not self.has_key("input_files", file_key):
            return None

        config_dir = self.current_config_path.parent if self.current_config_path else Path(".")
        return config_dir / self.config["input_files"][file_key]

    def is_loaded(self) -> bool:
        """Vérifie si une configuration est chargée"""
        return bool(self.config and self.current_config_path)

    def list_config_files(self, directory: str = ".", pattern: str = "*.toml") -> Dict[str, Any]:
        """Liste les fichiers de configuration disponibles"""
        try:
            config_dir = Path(directory)
            if not config_dir.exists():
                return {"error": f"Directory not found: {directory}"}

            config_files = []
            for file_path in config_dir.glob(pattern):
                if file_path.is_file():
                    config_files.append({
                        "name": file_path.name,
                        "path": str(file_path),
                        "size": file_path.stat().st_size,
                        "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                        "is_current": file_path == self.current_config_path
                    })

            return {
                "directory": str(config_dir),
                "pattern": pattern,
                "files": config_files,
                "count": len(config_files)
            }

        except Exception as e:
            logger.error(f"Error listing config files: {str(e)}")
            return {"error": f"Unable to list config files: {str(e)}"}

    def validate_config(self, required_sections=None, required_files=None) -> Dict[str, Any]:
        """Valide la configuration"""
        if not self.config:
            return {"valid": False, "errors": ["No configuration loaded"]}

        errors = []
        warnings = []

        # Sections requises par défaut
        if required_sections is None:
            required_sections = ["input_files", "master"]

        # Vérifier les sections requises
        for section in required_sections:
            if section not in self.config:
                errors.append(f"Missing required section: {section}")

        # Fichiers requis par défaut
        if required_files is None:
            required_files = ["scenario_file", "job_file", "dyd_file", "par_file"]

        # Vérifier les clés requises dans input_files
        if "input_files" in self.config:
            for file_key in required_files:
                if file_key not in self.config["input_files"]:
                    errors.append(f"Missing required file in input_files: {file_key}")
                else:
                    # Vérifier si le fichier existe
                    config_dir = self.current_config_path.parent if self.current_config_path else Path(".")
                    file_path = config_dir / self.config["input_files"][file_key]
                    if not file_path.exists():
                        warnings.append(f"File not found: {file_path}")

        # Vérifier les paramètres master
        if "master" in self.config:
            master_config = self.config["master"]
            required_master_keys = ["period", "speedup", "myEnvDynawo_path"]
            for key in required_master_keys:
                if key not in master_config:
                    errors.append(f"Missing required key in master section: {key}")

        is_valid = len(errors) == 0

        return {
            "valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "config_file": str(self.current_config_path) if self.current_config_path else None
        }

    def get_iidm_file_from_job(self) -> Optional[str]:
        """Récupère le fichier IIDM depuis le job file"""
        job_file_path = self.get_input_file_path("job_file")
        if not job_file_path or not job_file_path.exists():
            return None

        return self._parse_iidm_from_job_file(job_file_path)

    def get_iidm_file_path(self) -> Optional[Path]:
        """Récupère le chemin complet du fichier IIDM"""
        iidm_file = self.get_iidm_file_from_job()
        if not iidm_file:
            return None

        job_file_path = self.get_input_file_path("job_file")
        if not job_file_path:
            return None

        return job_file_path.parent / iidm_file

    def parse_job_file(self) -> Optional[Dict[str, Any]]:
        """Parse complètement le fichier job XML"""
        job_file_path = self.get_input_file_path("job_file")
        if not job_file_path or not job_file_path.exists():
            return None

        return self._parse_job_file(job_file_path)

    def _load_config_from_file(self, file_path: Path) -> Dict[str, Any]:
        """Charge la configuration depuis un fichier"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return toml.load(f)
        except Exception as e:
            logger.error(f"Error loading config from {file_path}: {e}")
            return {}

    def _parse_iidm_from_job_file(self, job_file_path: Path) -> Optional[str]:
        """Parse le fichier job XML pour extraire le fichier IIDM"""
        try:
            tree = ET.parse(job_file_path)
            root = tree.getroot()

            # Définir le namespace
            namespace = {"dynawo": "http://www.rte-france.com/dynawo"}

            # Chercher l'élément network avec l'attribut iidmFile
            network_element = root.find(".//dynawo:network[@iidmFile]", namespace)
            if network_element is not None:
                return network_element.get("iidmFile")

            return None

        except ET.ParseError as e:
            logger.error(f"Error parsing job file {job_file_path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error reading job file {job_file_path}: {e}")
            return None

    def _parse_job_file(self, job_file_path: Path) -> Dict[str, Any]:
        """Parse complètement le fichier job XML"""
        try:
            tree = ET.parse(job_file_path)
            root = tree.getroot()

            # Définir le namespace
            namespace = {"dynawo": "http://www.rte-france.com/dynawo"}

            job_data = {}

            # Récupérer les informations du job
            job_element = root.find(".//dynawo:job", namespace)
            if job_element is not None:
                job_data["job_name"] = job_element.get("name")

                # Solver
                solver_element = job_element.find("dynawo:solver", namespace)
                if solver_element is not None:
                    job_data["solver"] = {
                        "lib": solver_element.get("lib"),
                        "parFile": solver_element.get("parFile"),
                        "parId": solver_element.get("parId")
                    }

                # Modeler
                modeler_element = job_element.find("dynawo:modeler", namespace)
                if modeler_element is not None:
                    job_data["modeler"] = {}

                    # Network
                    network_element = modeler_element.find("dynawo:network", namespace)
                    if network_element is not None:
                        job_data["modeler"]["network"] = {
                            "iidmFile": network_element.get("iidmFile"),
                            "parFile": network_element.get("parFile"),
                            "parId": network_element.get("parId")
                        }

                    # Dynamic models
                    dyn_models = []
                    for dyn_model in modeler_element.findall("dynawo:dynModels", namespace):
                        dyd_file = dyn_model.get("dydFile")
                        if dyd_file:
                            dyn_models.append(dyd_file)
                    job_data["modeler"]["dynModels"] = dyn_models

                # Simulation
                simulation_element = job_element.find("dynawo:simulation", namespace)
                if simulation_element is not None:
                    job_data["simulation"] = {
                        "startTime": simulation_element.get("startTime"),
                        "stopTime": simulation_element.get("stopTime"),
                        "criteriaStep": simulation_element.get("criteriaStep"),
                        "precision": simulation_element.get("precision"),
                        "publishToZmq": simulation_element.get("publishToZmq"),
                        "triggerSimulationTimeStepInS": simulation_element.get("triggerSimulationTimeStepInS")
                    }

                # Outputs
                outputs_element = job_element.find("dynawo:outputs", namespace)
                if outputs_element is not None:
                    job_data["outputs"] = {
                        "directory": outputs_element.get("directory")
                    }

            return job_data

        except ET.ParseError as e:
            logger.error(f"Error parsing job file {job_file_path}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error reading job file {job_file_path}: {e}")
            return {}