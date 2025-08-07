import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/non_linear_shunt_compensator_section/{section_id}")
async def update_non_linear_shunt_compensator_section(
        section_id: str,
        g: Optional[float] = Form(None),
        b: Optional[float] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "g": g,
        "b": b
    }

    return await update_element_generic(
        section_id, "non_linear_shunt_compensator_sections", network.update_non_linear_shunt_compensator_sections,
        update_data, config, repository_manager
    )
