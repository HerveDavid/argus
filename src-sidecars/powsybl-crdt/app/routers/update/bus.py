import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/bus/{bus_id}")
async def update_bus(
        bus_id: str,
        v_mag: Optional[float] = Form(None),
        v_angle: Optional[float] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "v_mag": v_mag,
        "v_angle": v_angle,
        "fictitious": fictitious
    }

    return await update_element_generic(
        bus_id, "buses", network.update_buses,
        update_data, config, repository_manager
    )