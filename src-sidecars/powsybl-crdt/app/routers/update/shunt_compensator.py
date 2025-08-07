import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/shunt_compensator/{compensator_id}")
async def update_shunt_compensator(
        compensator_id: str,
        section_count: Optional[int] = Form(None),
        p: Optional[float] = Form(None),
        q: Optional[float] = Form(None),
        connected: Optional[bool] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "section_count": section_count,
        "p": p, "q": q,
        "connected": connected,
        "fictitious": fictitious
    }

    return await update_element_generic(
        compensator_id, "shunt_compensators", network.update_shunt_compensators,
        update_data, config, repository_manager
    )

