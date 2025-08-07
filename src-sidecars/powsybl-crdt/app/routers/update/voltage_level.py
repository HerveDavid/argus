import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)

@router.post("/voltage_level/{vl_id}")
async def update_voltage_level(
        vl_id: str,
        high_voltage_limit: Optional[float] = Form(None),
        low_voltage_limit: Optional[float] = Form(None),
        nominal_v: Optional[float] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "high_voltage_limit": high_voltage_limit,
        "low_voltage_limit": low_voltage_limit,
        "nominal_v": nominal_v,
        "fictitious": fictitious
    }

    return await update_element_generic(
        vl_id, "voltage_levels", network.update_voltage_levels,
        update_data, config, repository_manager
    )