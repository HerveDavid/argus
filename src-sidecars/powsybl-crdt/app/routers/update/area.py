import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/area/{area_id}")
async def update_area(
        area_id: str,
        interchange_target: Optional[float] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "interchange_target": interchange_target,
        "fictitious": fictitious
    }

    return await update_element_generic(
        area_id, "areas", network.update_areas,
        update_data, config, repository_manager
    )