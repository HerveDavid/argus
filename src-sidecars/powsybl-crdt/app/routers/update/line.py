import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/line/{line_id}")
async def update_line(
        line_id: str,
        r: Optional[float] = Form(None),
        x: Optional[float] = Form(None),
        g1: Optional[float] = Form(None),
        b1: Optional[float] = Form(None),
        g2: Optional[float] = Form(None),
        b2: Optional[float] = Form(None),
        connected1: Optional[bool] = Form(None),
        connected2: Optional[bool] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "r": r, "x": x,
        "g1": g1, "b1": b1, "g2": g2, "b2": b2,
        "connected1": connected1, "connected2": connected2,
        "fictitious": fictitious
    }

    return await update_element_generic(
        line_id, "lines", network.update_lines,
        update_data, config, repository_manager
    )
