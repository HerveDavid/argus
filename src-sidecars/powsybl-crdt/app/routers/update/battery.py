import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/battery/{battery_id}")
async def update_battery(
        battery_id: str,
        target_p: Optional[float] = Form(None),
        target_q: Optional[float] = Form(None),
        connected: Optional[bool] = Form(None),
        max_q: Optional[float] = Form(None),
        min_q: Optional[float] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "target_p": target_p,
        "target_q": target_q,
        "connected": connected,
        "max_q": max_q,
        "min_q": min_q,
        "fictitious": fictitious
    }

    return await update_element_generic(
        battery_id, "batteries", network.update_batteries,
        update_data, config, repository_manager
    )