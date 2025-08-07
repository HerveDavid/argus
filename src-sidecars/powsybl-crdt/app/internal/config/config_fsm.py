from pathlib import Path

from fastapi import UploadFile
from transitions.core import Machine
from typing import Optional, Dict, Any, Callable, Union, List
from datetime import datetime

import pypowsybl.network as pn
import logging

from app.internal.config.config_loader import ConfigLoader


class ConfigFSMError(Exception):
    pass


class ConfigFSM:
    states = [
        "idle",
        "loading",
        "ready"
    ]

    def __init__(self, logger: Optional[logging.Logger] = None):
        self.machine = Machine(
            model=self,
            states=ConfigFSM.states,
            initial="idle",
            auto_transitions=False,
            ignore_invalid_triggers=True
        )

        self.logger = logger or logging.getLogger(__name__)
        self._setup_transitions()

        self.name: Optional[str] = None
        self.config_source: Optional[Union[str, Path, UploadFile]] = None
        self.config: Optional[ConfigLoader] = None
        self.last_updated: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self.load_progress: float = 0.0

        self.on_load_complete: Optional[Callable] = None
        self.on_error: Optional[Callable] = None
        self.on_state_change: Optional[Callable] = None

    def _setup_transitions(self):
        self.machine.add_transition(
            trigger="start_load",
            source=["idle", "ready"],
            dest="loading",
            before="_prepare_loading"
        )

        self.machine.add_transition(
            trigger="load_complete",
            source="loading",
            dest="ready",
            before="_finalize_loading"
        )

        self.machine.add_transition(
            trigger="load_failed",
            source="loading",
            dest="idle",
            before="_handle_error"
        )

        self.machine.add_transition(
            trigger="reset",
            source=["ready", "loading"],
            dest="idle",
            before="_reset_state"
        )

    def _prepare_loading(self):
        self.last_error = None
        self.load_progress = 0.0
        self.logger.info(f"Starting load: {self.name}")
        self._notify_state_change()

    def _finalize_loading(self):
        self.last_updated = datetime.now()
        self.load_progress = 100.0
        self.last_error = None
        self.logger.info(f"Loading completed: {self.name}")
        if self.on_load_complete:
            self.on_load_complete(self)
        self._notify_state_change()

    def _handle_error(self, error_msg: str = "Unknown error"):
        self.last_error = error_msg
        self.load_progress = 0.0
        self.logger.error(f"Loading failed for {self.name}: {error_msg}")
        if self.on_error:
            self.on_error(self, error_msg)
        self._notify_state_change()

    def _reset_state(self):
        self.name = None
        self.config_source = None
        self.config = None
        self.last_error = None
        self.load_progress = 0.0
        self.last_updated = None
        self.logger.info("State reset")
        self._notify_state_change()

    def _notify_state_change(self):
        if self.on_state_change:
            self.on_state_change(self.state, self)

    async def load(self, name: str, config_source: Union[str, Path, UploadFile],
                   base_directory: Optional[Union[str, Path]] = None):
        if self.state == "loading":
            raise ConfigFSMError("Already loading, cannot start new load operation")

        self.name = name
        self.config_source = config_source

        self.start_load()

        try:
            base_dir = Path(base_directory) if base_directory else None

            self.config = ConfigLoader(config_source, self.logger, base_dir)
            await self._perform_config_load()
            await self._perform_load()

            self.load_complete()

        except Exception as e:
            self.load_failed(str(e))
            raise ConfigFSMError(f"Load failed: {e}")

    async def reload(self, name: str, config_source: Union[str, Path, UploadFile],
                     base_directory: Optional[Union[str, Path]] = None):
        if self.state == "loading":
            raise ConfigFSMError("Already loading, cannot start reload operation")

        old_name = self.name
        old_config_source = self.config_source
        old_config = self.config

        self.name = name
        self.config_source = config_source

        self.start_load()

        try:
            base_dir = Path(base_directory) if base_directory else None

            self.config = ConfigLoader(config_source, self.logger, base_dir)
            await self._perform_config_load()
            await self._perform_load()

            self.load_complete()

        except Exception as e:
            self.name = old_name
            self.config_source = old_config_source
            self.config = old_config

            self.load_failed(str(e))
            raise ConfigFSMError(f"Reload failed: {e}")

    def set_base_directory(self, directory: Union[str, Path]):
        if not self.config:
            raise ConfigFSMError("No configuration loaded")

        self.config.set_base_directory(directory)

        # Re-extraire les informations réseau
        try:
            self.config.network.extract_network_info()
            self.logger.info("Network information re-extracted with new base directory")
        except Exception as e:
            self.logger.warning(f"Could not re-extract network information with new base directory: {e}")

    async def _perform_config_load(self):
        if self.config:
            await self.config.load_config()
            self.load_progress += 50
            self.logger.debug(f"Config loaded, progress: {self.load_progress:.1f}%")

    async def _perform_load(self):
        steps = 2
        base_progress = self.load_progress
        remaining_progress = 100 - base_progress

        for i in range(steps):
            step_progress = ((i + 1) / steps) * remaining_progress
            self.load_progress = base_progress + step_progress
            self.logger.debug(f"Progress: {self.load_progress:.1f}%")

    def get_status(self) -> Dict[str, Any]:
        def _get_source_display(source):
            if hasattr(source, 'filename'):
                return source.filename
            elif isinstance(source, Path):
                return str(source.resolve())
            elif isinstance(source, str):
                try:
                    return str(Path(source).resolve())
                except (OSError, ValueError):
                    return source
            else:
                return str(source) if source else None

        if self.config:
            try:
                config_info = self.config.get_config_summary()
                config_info["source"] = _get_source_display(self.config_source)
                config_info["loaded_at"] = self.last_updated.isoformat() if self.last_updated else None

            except Exception as e:
                self.logger.warning(f"Failed to get config summary: {e}")
                config_info = {
                    "status": "error",
                    "error": f"Failed to get config summary: {str(e)}",
                    "sections": list(self.config.config.keys()) if self.config.config else [],
                    "loaded": bool(self.config.config)
                }
        else:
            config_info = {"status": "not_loaded"}

        return {
            "name": self.name,
            "source": _get_source_display(self.config_source),
            "configuration": config_info,
        }

    def get_config_parameter(self, section: str, parameter: str, default: Any = None) -> Any:
        if not self.config or not self.config.config:
            raise ConfigFSMError("No configuration loaded")
        return self.config.get_parameter(section, parameter, default)

    def get_config_section(self, section_name: str) -> Dict[str, Any]:
        if not self.config or not self.config.config:
            raise ConfigFSMError("No configuration loaded")
        return self.config.get_section(section_name)

    def get_config_log_level(self) -> str:
        if not self.config or not self.config.config:
            raise ConfigFSMError("No configuration loaded")
        return self.config.get_log_level()

    def get_config_sliders_config(self, section: str = 'hmi') -> List[Dict[str, Any]]:
        if not self.config or not self.config.config:
            raise ConfigFSMError("No configuration loaded")
        return self.config.get_sliders_config(section)

    def get_config_button_ids(self, section: str = 'hmi') -> Dict[str, List[str]]:
        if not self.config or not self.config.config:
            raise ConfigFSMError("No configuration loaded")
        return self.config.get_button_ids(section)

    def is_ready(self) -> bool:
        return self.state == "ready"

    def is_loading(self) -> bool:
        return self.state == "loading"

    def is_idle(self) -> bool:
        return self.state == "idle"

    def has_error(self) -> bool:
        return self.last_error is not None

    def get_last_error(self) -> Optional[str]:
        return self.last_error

    def clear_error(self):
        self.last_error = None

    def get_allowed_transitions(self) -> list:
        return [trigger for trigger in self.machine.get_triggers(self.state)]

    def set_load_callback(self, callback: Callable):
        self.on_load_complete = callback

    def set_error_callback(self, callback: Callable):
        self.on_error = callback

    def set_state_change_callback(self, callback: Callable):
        self.on_state_change = callback

    @property
    def network(self) -> Optional[pn.Network]:
        return self.config.network.iidm_network
