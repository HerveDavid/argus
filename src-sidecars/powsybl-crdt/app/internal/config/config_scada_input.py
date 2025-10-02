import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional


class ConfigScadaInput:
    def __init__(self, config_loader, logger: Optional[logging.Logger] = None, base_directory: Optional[Path] = None):
        self.config_loader = config_loader
        self.logger = logger or logging.getLogger(__name__)
        self.base_directory = base_directory
        self._inputs_file_path: Optional[Path] = None
        self._inputs_data: List[Dict[str, Any]] = []

    def set_base_directory(self, directory: Path):
        self.base_directory = directory
        self.logger.info(f"Base directory set to: {directory}")

    def extract_inputs_info(self):
        if not self.config_loader.config:
            raise RuntimeError("Configuration not loaded")

        try:
            inputs_file = self.config_loader.get_parameter('input_files', 'dynawo_scada_inputs_file')
            if not inputs_file:
                raise ValueError("dynawo_scada_inputs_file not found in configuration")

            base_dir = self._determine_base_directory()
            self._inputs_file_path = base_dir / inputs_file

            if not self._inputs_file_path.exists():
                raise FileNotFoundError(f"Dynawo SCADA inputs file not found: {self._inputs_file_path}")

            self._load_inputs_data()

            self.logger.info(f"Base directory: {base_dir}")
            self.logger.info(f"SCADA inputs file: {self._inputs_file_path}")
            self.logger.info(f"Loaded {len(self._inputs_data)} SCADA input entries")

        except Exception as e:
            self.logger.error(f"Error extracting SCADA inputs info: {e}")
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

    def _load_inputs_data(self):
        try:
            with open(self._inputs_file_path, 'r', encoding='utf-8') as f:
                self._inputs_data = json.load(f)

            if not isinstance(self._inputs_data, list):
                raise ValueError("JSON file should contain a list of SCADA input entries")

            self._validate_inputs_data()

        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parsing error: {e}")
        except Exception as e:
            raise ValueError(f"Error loading SCADA inputs file: {e}")

    def _validate_inputs_data(self):
        required_fields = [
            'id', 'dynawo_id'
        ]

        optional_fields = [
            'tase2', 'source', 'destination', 'topic'
        ]

        for i, entry in enumerate(self._inputs_data):
            if not isinstance(entry, dict):
                raise ValueError(f"Entry {i} is not a dictionary")

            for field in required_fields:
                if field not in entry or entry[field] is None:
                    raise ValueError(f"Missing required field '{field}' in entry {i}")

            for field in optional_fields:
                if field not in entry:
                    self.logger.debug(f"Optional field '{field}' missing in entry {i}")

        self.logger.info("SCADA inputs data validation completed")

    @property
    def inputs_file_path(self) -> Optional[Path]:
        return self._inputs_file_path

    @property
    def inputs_file_absolute_path(self) -> Optional[str]:
        if self._inputs_file_path:
            return str(self._inputs_file_path.resolve())
        return None

    @property
    def inputs_data(self) -> List[Dict[str, Any]]:
        return self._inputs_data

    def get_inputs_by_topic(self, topic: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._inputs_data if entry.get('topic') == topic]

    def get_inputs_by_source(self, source: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._inputs_data if entry.get('source') == source]

    def get_inputs_by_destination(self, destination: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._inputs_data if entry.get('destination') == destination]

    def get_inputs_by_tase2(self, tase2: str) -> List[Dict[str, Any]]:
        return [entry for entry in self._inputs_data if entry.get('tase2') == tase2]

    def get_input_by_id(self, input_id: str) -> Optional[Dict[str, Any]]:
        for entry in self._inputs_data:
            if entry.get('id') == input_id or entry.get('dynawo_id') == input_id:
                return entry
        return None

    def get_input_by_tase2_id(self, tase2_id: str) -> Optional[Dict[str, Any]]:
        for entry in self._inputs_data:
            if entry.get('tase2') == tase2_id:
                return entry
        return None

    def get_all_topics(self) -> List[str]:
        topics = set()
        for entry in self._inputs_data:
            if entry.get('topic'):
                topics.add(entry['topic'])
        return sorted(list(topics))

    def get_all_sources(self) -> List[str]:
        sources = set()
        for entry in self._inputs_data:
            if entry.get('source'):
                sources.add(entry['source'])
        return sorted(list(sources))

    def get_all_destinations(self) -> List[str]:
        destinations = set()
        for entry in self._inputs_data:
            if entry.get('destination'):
                destinations.add(entry['destination'])
        return sorted(list(destinations))

    def get_all_tase2_ids(self) -> List[str]:
        tase2_ids = set()
        for entry in self._inputs_data:
            if entry.get('tase2'):
                tase2_ids.add(entry['tase2'])
        return sorted(list(tase2_ids))

    def filter_inputs(self, **criteria) -> List[Dict[str, Any]]:
        filtered_inputs = []

        for entry in self._inputs_data:
            match = True
            for key, value in criteria.items():
                if key not in entry or entry[key] != value:
                    match = False
                    break

            if match:
                filtered_inputs.append(entry)

        return filtered_inputs

    def validate_files_exist(self) -> bool:
        if self._inputs_file_path and not self._inputs_file_path.exists():
            self.logger.error(f"SCADA inputs file does not exist: {self._inputs_file_path}")
            return False
        return True

    def get_inputs_summary(self) -> Dict[str, Any]:
        return {
            "inputs_file_path": self.inputs_file_absolute_path,
            "base_directory": str(self.base_directory) if self.base_directory else None,
            "total_inputs": len(self._inputs_data),
            "topics": self.get_all_topics(),
            "sources": self.get_all_sources(),
            "destinations": self.get_all_destinations(),
            "tase2_ids_count": len(self.get_all_tase2_ids()),
            "topics_count": len(self.get_all_topics()),
            "sources_count": len(self.get_all_sources()),
            "destinations_count": len(self.get_all_destinations())
        }

    def __str__(self) -> str:
        if not self._inputs_data:
            return f"ConfigScadaInput(not loaded): {self._inputs_file_path}"
        return f"ConfigScadaInput: {len(self._inputs_data)} SCADA inputs loaded from {self._inputs_file_path}"

    def __repr__(self) -> str:
        return self.__str__()