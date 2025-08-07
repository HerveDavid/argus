import logging
import platform
from pathlib import Path
from typing import Dict, Any, List, Union, Optional

import toml

from .config_game_master_output import ConfigGameMasterOutput
from .config_network import ConfigNetwork
from .config_scada_output import ConfigScadaOutput

try:
    from fastapi import UploadFile as FastAPIUploadFile
except ImportError:
    FastAPIUploadFile = None

try:
    from starlette.datastructures import UploadFile as StarletteUploadFile
except ImportError:
    StarletteUploadFile = None


class ConfigLoader:
    def __init__(self, config_source: Union[str, Path, 'UploadFile'],
                 logger: Optional[logging.Logger] = None,
                 base_directory: Optional[Path] = None):
        self.config_source = config_source
        self.config_path = None
        self.base_directory = base_directory

        if isinstance(config_source, (str, Path)):
            self.config_path = Path(config_source)

        self.config: Dict[str, Any] = {}
        self.logger = logger or logging.getLogger(__name__)

        self.network = ConfigNetwork(self, self.logger, self.base_directory)
        self.game_master_outputs = ConfigGameMasterOutput(self, self.logger, self.base_directory)
        self.scada_outputs = ConfigScadaOutput(self, self.logger, self.base_directory)

    def set_base_directory(self, directory: Union[str, Path]):
        """Permet de définir le répertoire de base après initialisation."""
        self.base_directory = Path(directory)
        self.network.set_base_directory(self.base_directory)
        self.logger.info(f"Base directory updated to: {self.base_directory}")

    async def load_config(self) -> Dict[str, Any]:
        try:
            config_content = ""

            self.logger.debug(f"Config source type: {type(self.config_source)}")
            self.logger.debug(f"Config source: {self.config_source}")
            self.logger.debug(f"Base directory: {self.base_directory}")

            def is_upload_file(obj):
                if FastAPIUploadFile and isinstance(obj, FastAPIUploadFile):
                    return True
                if StarletteUploadFile and isinstance(obj, StarletteUploadFile):
                    return True
                return (hasattr(obj, 'read') and
                        hasattr(obj, 'filename') and
                        hasattr(obj, 'seek') and
                        callable(getattr(obj, 'read', None)))

            if is_upload_file(self.config_source):
                self.logger.info("Loading from UploadFile")
                content_bytes = await self.config_source.read()
                config_content = content_bytes.decode('utf-8')
                self.logger.info(f"Configuration loaded from uploaded file: {self.config_source.filename}")

                await self.config_source.seek(0)

            elif isinstance(self.config_source, (str, Path)):
                self.logger.info("Loading from file path")
                if self.config_path is None:
                    raise ValueError("Config path is None - invalid configuration source")

                if not self.config_path.exists():
                    raise FileNotFoundError(f"Configuration file does not exist: {self.config_path}")

                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config_content = f.read()

                self.logger.info(f"Configuration loaded from: {self.config_path}")

            else:
                raise ValueError(f"Unsupported config source type: {type(self.config_source)}")

            self.config = toml.loads(config_content)

            self._validate_config()
            self._normalize_paths()

            try:
                self.network.extract_network_info()
            except Exception as e:
                self.logger.warning(f"Could not extract network information: {e}")

            try:
                self.game_master_outputs.extract_outputs_info()
            except Exception as e:
                self.logger.warning(f"Could not extract game master outputs info: {e}")

            try:
                self.scada_outputs.extract_outputs_info()
            except Exception as e:
                self.logger.warning(f"Could not extract scada outputs info: {e}")

            return self.config

        except toml.TomlDecodeError as e:
            raise ValueError(f"TOML parsing error: {e}")
        except Exception as e:
            self.logger.error(f"Error loading configuration: {e}")
            raise

    def _validate_config(self):
        required_sections = ['master', 'input_files', 'hmi', 'game_master']

        for section in required_sections:
            if section not in self.config:
                raise ValueError(f"Missing section in configuration: {section}")

        master = self.config.get('master', {})
        required_master_params = ['period', 'speedup', 'myEnvDynawo_path']
        for param in required_master_params:
            if param not in master:
                raise ValueError(f"Missing '{param}' parameter in [master] section")

        input_files = self.config.get('input_files', {})
        required_input_files = [
            'scenario_file', 'job_file', 'dyd_file', 'par_file',
            'dynawo_game_master_outputs_file', 'dynawo_scada_outputs_file',
            'cyber_config_file'
        ]
        for file_param in required_input_files:
            if file_param not in input_files:
                self.logger.warning(f"Missing '{file_param}' in [input_files] section")

        for section_name in ['hmi', 'game_master']:
            section = self.config.get(section_name, {})
            if 'sliders' in section and not isinstance(section['sliders'], list):
                raise ValueError(f"'{section_name}.sliders' must be a list")

            if 'sliders' in section:
                for i, slider in enumerate(section['sliders']):
                    required_slider_keys = ['id', 'min', 'max', 'val', 'label']
                    for key in required_slider_keys:
                        if key not in slider:
                            raise ValueError(f"Missing '{key}' in slider {i} of section '{section_name}'")

        self.logger.info("Configuration validation successful")

    def _normalize_paths(self):
        master = self.config.get('master', {})
        if 'myEnvDynawo_path' in master:
            dynawo_path = master['myEnvDynawo_path']
            master['myEnvDynawo_path'] = str(Path(dynawo_path).expanduser().resolve())

        input_files = self.config.get('input_files', {})
        for key, value in input_files.items():
            if isinstance(value, str) and ('/' in value or '\\' in value):
                input_files[key] = str(Path(value).expanduser())

        self.logger.info("Path normalization completed")

    def get_section(self, section_name: str) -> Dict[str, Any]:
        if not self.config:
            raise RuntimeError("Configuration not loaded. Call load_config() first.")
        return self.config.get(section_name, {})

    def get_parameter(self, section: str, parameter: str, default: Any = None) -> Any:
        section_data = self.get_section(section)
        return section_data.get(parameter, default)

    def get_nested_parameter(self, section: str, subsection: str, parameter: str, default: Any = None) -> Any:
        section_data = self.get_section(section)
        subsection_data = section_data.get(subsection, {})
        return subsection_data.get(parameter, default)

    def get_log_level(self) -> str:
        return self.config.get('log_level', 'INFO')

    def get_master_config(self) -> Dict[str, Any]:
        return self.get_section('master')

    def get_input_files_config(self) -> Dict[str, str]:
        return self.get_section('input_files')

    def get_sliders_config(self, section: str = 'hmi') -> List[Dict[str, Any]]:
        section_data = self.get_section(section)
        return section_data.get('sliders', [])

    def get_button_ids(self, section: str = 'hmi') -> Dict[str, List[str]]:
        section_data = self.get_section(section)
        return {
            'line_button_ids': section_data.get('line_button_ids', []),
            'bool_button_ids': section_data.get('bool_button_ids', [])
        }

    def get_subscribed_substations(self, section: str = 'hmi') -> List[str]:
        section_data = self.get_section(section)
        return section_data.get('subscribed_substations', [])

    def get_plot_data_config(self, section: str = 'hmi') -> Dict[str, List[str]]:
        section_data = self.get_section(section)
        return section_data.get('plot_data', {})

    def get_outputs_destination(self, section: str = 'hmi') -> Dict[str, str]:
        section_data = self.get_section(section)
        return section_data.get('outputs_destination', {})

    def get_location(self, section: str = 'hmi') -> str:
        return self.get_parameter(section, 'location', 'Unknown')

    def get_all_slider_ids(self, section: str = 'hmi') -> List[str]:
        sliders = self.get_sliders_config(section)
        return [slider.get('id') for slider in sliders if 'id' in slider]

    def get_slider_by_id(self, slider_id: str, section: str = 'hmi') -> Optional[Dict[str, Any]]:
        sliders = self.get_sliders_config(section)
        for slider in sliders:
            if slider.get('id') == slider_id:
                return slider
        return None

    def get_all_plot_variables(self, section: str = 'hmi') -> List[str]:
        plot_data = self.get_plot_data_config(section)
        all_variables = []
        for category, variables in plot_data.items():
            if isinstance(variables, list):
                all_variables.extend(variables)
        return all_variables

    @staticmethod
    def is_windows() -> bool:
        return platform.system() == 'Windows'

    @staticmethod
    def is_linux() -> bool:
        return platform.system() == 'Linux'

    def __str__(self) -> str:
        if not self.config:
            source_info = (
                self.config_source.filename if hasattr(self.config_source, 'filename')
                else str(self.config_path) if self.config_path
                else "Unknown source"
            )
            return f"ConfigLoader(not loaded): {source_info}"
        sections = list(self.config.keys())
        source_info = (
            self.config_source.filename if hasattr(self.config_source, 'filename')
            else str(self.config_path) if self.config_path
            else "Unknown source"
        )
        return f"ConfigLoader: {len(sections)} sections loaded from {source_info}"

    def __repr__(self) -> str:
        return self.__str__()

    def get_config_summary(self) -> Dict[str, Any]:
        if not self.config:
            return {"status": "not_loaded"}

        summary = {
            "status": "loaded",
            "log_level": self.get_log_level(),
            "sections": list(self.config.keys()),
            "master": {
                "period": self.get_parameter('master', 'period'),
                "speedup": self.get_parameter('master', 'speedup'),
                "dynawo_configured": bool(self.get_parameter('master', 'myEnvDynawo_path'))
            },
            "hmi": {
                "location": self.get_location('hmi'),
                "slider_count": len(self.get_sliders_config('hmi')),
                "substations_count": len(self.get_subscribed_substations('hmi')),
                "bool_buttons_count": len(self.get_button_ids('hmi')['bool_button_ids'])
            },
            "game_master": {
                "slider_count": len(self.get_sliders_config('game_master')),
                "substations_count": len(self.get_subscribed_substations('game_master')),
                "bool_buttons_count": len(self.get_button_ids('game_master')['bool_button_ids'])
            },
            "network": self.network.get_network_summary()
        }

        return summary