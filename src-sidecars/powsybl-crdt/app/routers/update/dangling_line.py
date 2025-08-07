import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/dangling_line/{line_id}")
async def update_dangling_line(
        line_id: str,
        r: Optional[float] = Form(None),
        x: Optional[float] = Form(None),
        g: Optional[float] = Form(None),
        b: Optional[float] = Form(None),
        p0: Optional[float] = Form(None),
        q0: Optional[float] = Form(None),
        p: Optional[float] = Form(None),
        q: Optional[float] = Form(None),
        connected: Optional[bool] = Form(None),
        fictitious: Optional[bool] = Form(None),
        pairing_key: Optional[str] = Form(None),
        bus_breaker_bus_id: Optional[str] = Form(None),
        selected_limits_group: Optional[str] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "r": r, "x": x, "g": g, "b": b,
        "p0": p0, "q0": q0, "p": p, "q": q,
        "connected": connected, "fictitious": fictitious,
        "pairing_key": pairing_key, "bus_breaker_bus_id": bus_breaker_bus_id,
        "selected_limits_group": selected_limits_group
    }

    return await update_element_generic(
        line_id, "dangling_lines", network.update_dangling_lines,
        update_data, config, repository_manager
    )