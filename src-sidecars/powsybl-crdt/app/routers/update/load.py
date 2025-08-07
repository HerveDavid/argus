import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)

@router.post("/load/{load_id}")
async def update_load(
        load_id: str,
        p0: Optional[float] = Form(None),
        q0: Optional[float] = Form(None),
        connected: Optional[bool] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "p0": p0,
        "q0": q0,
        "connected": connected,
        "fictitious": fictitious
    }

    return await update_element_generic(
        load_id, "loads", network.update_loads,
        update_data, config, repository_manager
    )