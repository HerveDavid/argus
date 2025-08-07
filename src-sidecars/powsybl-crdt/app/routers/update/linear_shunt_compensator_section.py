import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/linear_shunt_compensator_section/{section_id}")
async def update_linear_shunt_compensator_section(
        section_id: str,
        g_per_section: Optional[float] = Form(None),
        b_per_section: Optional[float] = Form(None),
        max_section_count: Optional[int] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "g_per_section": g_per_section,
        "b_per_section": b_per_section,
        "max_section_count": max_section_count
    }

    return await update_element_generic(
        section_id, "linear_shunt_compensator_sections", network.update_linear_shunt_compensator_sections,
        update_data, config, repository_manager
    )
