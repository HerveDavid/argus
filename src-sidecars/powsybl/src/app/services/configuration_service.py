from abc import ABC, abstractmethod
from typing import Optional

from src.features.config.controller import ConfigController


class ConfigurationService(ABC):

    @abstractmethod
    def load_config(self, file_path: str) -> bool:
        pass

    @abstractmethod
    def get_iidm_file_path(self) -> Optional[str]:
        pass

    @abstractmethod
    def is_loaded(self) -> bool:
        pass



class ConfigurationServiceImpl(ConfigurationService):

    def __init__(self):
        self._config_controller = ConfigController()

    def load_config(self, file_path: str) -> bool:
        return self._config_controller.load_config(file_path)

    def get_iidm_file_path(self) -> Optional[str]:
        iidm_path = self._config_controller.get_iidm_file_path()
        return str(iidm_path) if iidm_path else None

    def is_loaded(self) -> bool:
        return self._config_controller.is_loaded()

    def get_controller(self) -> ConfigController:
        return self._config_controller