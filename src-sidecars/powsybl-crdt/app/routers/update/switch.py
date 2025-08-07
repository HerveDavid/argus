import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/switch/{switch_id}")
async def update_switch(
        switch_id: str,
        open: bool = Form(...),
        retained: Optional[bool] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "open": open,
        "retained": retained,
        "fictitious": fictitious
    }

    return await update_element_generic(
        switch_id, "switches", network.update_switches,
        update_data, config, repository_manager
    )