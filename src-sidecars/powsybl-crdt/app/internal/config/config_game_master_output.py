import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Union


class ConfigGameMasterOutput:
    def __init__(self, config_loader, logger: Optional[logging.Logger] = None, base_directory: Optional[Path] = None):
        self.config_loader = config_loader
        self.logger = logger or logging.getLogger(__name__)
        self.base_directory = base_directory
        self._outputs_file_path: Optional[Path] = None
        self._outputs_data: List[Dict[str, Any]] = []

    def set_base_directory(self, directory: Path):
        self.base_directory = directory
        self.logger.info(f"Base directory set to: {directory}")

    def extract_outputs_info(self):
        if not self.config_loader.config:
            raise RuntimeError("Configuration not loaded")

        try:
            outputs_file = self.config_loader.get_parameter('input_files', 'dynawo_game_master_outputs_file')
            if not outputs_file:
                raise ValueError("dynawo_game_master_outputs_file not found in configuration")

            base_dir = self._determine_base_directory()
            self._outputs_file_path = base_dir / outputs_file

            if not self._outputs_file_path.exists():
                raise FileNotFoundError(f"Dynawo game master outputs file not found: {self._outputs_file_path}")

            self._load_outputs_data()

            self.logger.info(f"Base directory: {base_dir}")
            self.logger.info(f"Outputs file: {self._outputs_file_path}")
            self.logger.info(f"Loaded {len(self._outputs_data)} output entries")

        except Exception as e:
            self.logger.error(f"Error extracting outputs info: {e}")
            raise

    def _determine_base_directory(self) -> Path:
        if self.base_directory:
            self.logger.debug(f"Using explicit base directory: {self.base_directory}")
            return self.base_directory

        if self.config_loader.config_path:
            base_dir = self.config_loader.config_path.parent
            self.logger.debug(f"Using config file parent directory: {base_dir}")
            return base_dir

        base_dir = Path.cwd()
        self.logger.warning(f"No base directory specified, using current directory: {base_dir}")
        return base_dir

    def _load_outputs_data(self):
        try:
            with open(self._outputs_file_path, 'r', encoding='utf-8') as f:
                self._outputs_data = json.load(f)

            if not isinstance(self._outputs_data, list):
                raise ValueError("JSON file should contain a list of output entries")

            self._validate_outputs_data()

        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parsing error: {e}")
        except Exception as e:
            raise ValueError(f"Error loading outputs file: {e}")

    def _validate_outputs_data(self):
        required_fields = [
            'id'
        ]

        optional_fields = [
            'model_lib', 'equipmentId', 'kind', 'voltage_level', 'substation',
            'graphical_id', 'iidm_class', 'topic', 'dynawo_id', 'model', 'variable'
        ]

        for i, entry in enumerate(self._outputs_data):
            if not isinstance(entry, dict):
                raise ValueError(f"Entry {i} is not a dictionary")

            for field in required_fields:
                if field not in entry or entry[field] is None:
                    raise ValueError(f"Missing required field '{field}' in entry {i}")

            for field in optional_fields:
                if field not in entry:
                    self.logger.debug(f"Optional field '{field}' missing in entry {i}")

        self.logger.info("Outputs data validation completed")

    @property
    def outputs_file_path(self) -> Optional[Path]:
        return self._outputs_file_path

    @property
    def outputs_file_absolute_path(self) -> Optional[str]:
        if self._outputs_file_path:
            return str(self._outputs_file_path.resolve())
        return None

    @property
    def outputs_data(self) -> List[Dict[str, Any]]:
        return self._outputs_data

    def get_outputs_by_substation(self, substation: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._outputs_data if entry.get('substation') == substation]

    def get_outputs_by_topic(self, topic: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._outputs_data if entry.get('topic') == topic]

    def get_outputs_by_kind(self, kind: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._outputs_data if entry.get('kind') == kind]

    def get_outputs_by_iidm_class(self, iidm_class: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._outputs_data if entry.get('iidm_class') == iidm_class]

    def get_output_by_id(self, output_id: str) -> Optional[Dict[str, Any]]:
        for entry in self._outputs_data:
            if entry.get('id') == output_id or entry.get('dynawo_id') == output_id:
                return entry
        return None

    def get_output_by_graphical_id(self, graphical_id: str) -> Optional[Dict[str, Any]]:
        for entry in self._outputs_data:
            if entry.get('graphical_id') == graphical_id:
                return entry
        return None

    def get_all_substations(self) -> List[str]:
        substations = set()
        for entry in self._outputs_data:
            if entry.get('substation'):
                substations.add(entry['substation'])
        return sorted(list(substations))

    def get_all_topics(self) -> List[str]:
        topics = set()
        for entry in self._outputs_data:
            if entry.get('topic'):
                topics.add(entry['topic'])
        return sorted(list(topics))

    def get_all_kinds(self) -> List[str]:
        kinds = set()
        for entry in self._outputs_data:
            if entry.get('kind'):
                kinds.add(entry['kind'])
        return sorted(list(kinds))

    def get_all_iidm_classes(self) -> List[str]:
        classes = set()
        for entry in self._outputs_data:
            if entry.get('iidm_class'):
                classes.add(entry['iidm_class'])
        return sorted(list(classes))

    def filter_outputs(self, **criteria) -> List[Dict[str, Any]]:
        filtered_outputs = []

        for entry in self._outputs_data:
            match = True
            for key, value in criteria.items():
                if key not in entry or entry[key] != value:
                    match = False
                    break

            if match:
                filtered_outputs.append(entry)

        return filtered_outputs

    def validate_files_exist(self) -> bool:
        if self._outputs_file_path and not self._outputs_file_path.exists():
            self.logger.error(f"Outputs file does not exist: {self._outputs_file_path}")
            return False
        return True

    def get_outputs_summary(self) -> Dict[str, Any]:
        return {
            "outputs_file_path": self.outputs_file_absolute_path,
            "base_directory": str(self.base_directory) if self.base_directory else None,
            "total_outputs": len(self._outputs_data),
            "substations": self.get_all_substations(),
            "topics": self.get_all_topics(),
            "kinds": self.get_all_kinds(),
            "iidm_classes": self.get_all_iidm_classes(),
            "substations_count": len(self.get_all_substations()),
            "topics_count": len(self.get_all_topics()),
            "kinds_count": len(self.get_all_kinds()),
            "iidm_classes_count": len(self.get_all_iidm_classes())
        }

    def __str__(self) -> str:
        if not self._outputs_data:
            return f"DynawoGameMasterOutput(not loaded): {self._outputs_file_path}"
        return f"DynawoGameMasterOutput: {len(self._outputs_data)} outputs loaded from {self._outputs_file_path}"

    def __repr__(self) -> str:
        return self.__str__()