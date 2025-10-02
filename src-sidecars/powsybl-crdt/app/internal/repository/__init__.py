from typing import Optional
from fastapi import HTTPException, status

import asyncio
import logging
import pypowsybl.network as pn

from app.internal.diagram.diagram_manager import DiagramManager
from app.internal.config.config_fsm import ConfigFSM

from .repository import Repository


logger = logging.getLogger(__name__)


__all__ = ["RepositoryManager", "Repository"]


class RepositoryManager:
    def __init__(self):
        self._repository: Optional[Repository] = None
        self._config_fsm: Optional[ConfigFSM] = None
        self._diagram_manager: Optional[DiagramManager] = None
        self._initialization_lock = asyncio.Lock()
        self._last_config_name: Optional[str] = None

    async def ensure_repository(self, config_fsm: ConfigFSM):
        if not config_fsm.is_ready():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Configuration not ready. Current state: {config_fsm.state}"
            )

        async with self._initialization_lock:
            current_config_name = config_fsm.name
            needs_recreation = (
                    self._repository is None or
                    self._last_config_name != current_config_name
            )

            if needs_recreation:
                if self._repository is not None:
                    try:
                        self._repository.close()
                        logger.info("Closed previous repository")
                    except Exception as e:
                        logger.warning(f"Error closing previous repository: {e}")

                try:
                    network = config_fsm.network
                    if network is None:
                        raise ValueError("Network not available in configuration")

                    # Récupérer les données JSON depuis la configuration
                    game_master_outputs_data = None
                    scada_outputs_data = None

                    if hasattr(config_fsm.config, 'game_master_outputs'):
                        game_master_outputs_data = config_fsm.config.game_master_outputs.outputs_data

                    if hasattr(config_fsm.config, 'scada_outputs'):
                        scada_outputs_data = config_fsm.config.scada_outputs.outputs_data

                    if hasattr(config_fsm.config, 'scada_inputs'):
                        scada_outputs_data = config_fsm.config.scada_inputs.inputs_data

                    # Créer le repository avec les données JSON
                    self._repository = Repository(
                        network,
                        game_master_outputs_data=game_master_outputs_data,
                        scada_outputs_data=scada_outputs_data,
                        scada_inputs_data=scada_outputs_data
                    )
                    self._repository.initialize_all_repositories()

                    self._config_fsm = config_fsm
                    self._last_config_name = current_config_name
                    self._diagram_manager = DiagramManager(network)

                    logger.info(f"Repository initialized for config: {current_config_name}")

                except Exception as e:
                    self._repository = None
                    self._last_config_name = None
                    logger.error(f"Failed to initialize repository: {e}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to initialize repository: {str(e)}"
                    )

            return self

    def get_repository_if_ready(self) -> Optional[Repository]:
        return self._repository

    def get_network_if_ready(self) -> Optional[pn.Network]:
        return self._repository.get_network()

    def get_diagram_manager_if_ready(self) -> Optional[DiagramManager]:
        return self._diagram_manager

    def is_ready(self) -> bool:
        return self._repository is not None

    def get_status(self) -> dict:
        return {
            "repository_ready": self.is_ready(),
            "config_name": self._last_config_name,
            "has_config_fsm": self._config_fsm is not None
        }

    def close(self) -> None:
        if self._repository:
            try:
                self._repository.close()
                logger.info("Repository closed")
            except Exception as e:
                logger.error(f"Error closing repository: {e}")
            finally:
                self._repository = None
                self._last_config_name = None
