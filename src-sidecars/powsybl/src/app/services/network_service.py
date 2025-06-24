import pypowsybl as pp

from pathlib import Path
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

from src.utils.logger import get_logger

logger = get_logger(__name__)

class NetworkService(ABC):

    @abstractmethod
    def load_network(self, iidm_path: str) -> bool:
        pass

    @abstractmethod
    def get_network_path(self) -> Optional[str]:
        pass

    @abstractmethod
    def is_loaded(self) -> bool:
        pass


class NetworkServiceImpl(NetworkService):

    def __init__(self):
        self._network: Optional[pp.network.Network] = None
        self._network_path: Optional[str] = None

    def load_network(self, iidm_path: str) -> bool:
        try:
            if not Path(iidm_path).exists():
                logger.error(f"IIDM file not found: {iidm_path}")
                return False

            self._network = pp.network.load(iidm_path)
            self._network_path = iidm_path
            logger.info(f"Network loaded from: {iidm_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load network: {e}")
            self._network = None
            self._network_path = None
            return False

    def is_loaded(self) -> bool:
        return self._network is not None

    def get_network(self) -> Optional[pp.network.Network]:
        return self._network

    def get_network_path(self) -> Optional[str]:
        return self._network_path