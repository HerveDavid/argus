import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/hvdc_line/{hvdc_id}")
async def update_hvdc_line(
        hvdc_id: str,
        converters_mode: Optional[str] = Form(None),
        target_p: Optional[float] = Form(None),
        max_p: Optional[float] = Form(None),
        nominal_v: Optional[float] = Form(None),
        r: Optional[float] = Form(None),
        connected1: Optional[bool] = Form(None),
        connected2: Optional[bool] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "converters_mode": converters_mode,
        "target_p": target_p, "max_p": max_p,
        "nominal_v": nominal_v, "r": r,
        "connected1": connected1, "connected2": connected2,
        "fictitious": fictitious
    }

    return await update_element_generic(
        hvdc_id, "hvdc_lines", network.update_hvdc_lines,
        update_data, config, repository_manager
    )