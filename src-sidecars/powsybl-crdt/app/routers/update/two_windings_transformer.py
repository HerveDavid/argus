import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/two_windings_transformer/{transformer_id}")
async def update_transformer(
        transformer_id: str,
        r: Optional[float] = Form(None),
        x: Optional[float] = Form(None),
        g: Optional[float] = Form(None),
        b: Optional[float] = Form(None),
        rated_u1: Optional[float] = Form(None),
        rated_u2: Optional[float] = Form(None),
        rated_s: Optional[float] = Form(None),
        p1: Optional[float] = Form(None),
        q1: Optional[float] = Form(None),
        p2: Optional[float] = Form(None),
        q2: Optional[float] = Form(None),
        connected1: Optional[bool] = Form(None),
        connected2: Optional[bool] = Form(None),
        fictitious: Optional[bool] = Form(None),
        selected_limits_group_1: Optional[str] = Form(None),
        selected_limits_group_2: Optional[str] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "r": r, "x": x, "g": g, "b": b,
        "rated_u1": rated_u1, "rated_u2": rated_u2, "rated_s": rated_s,
        "p1": p1, "q1": q1, "p2": p2, "q2": q2,
        "connected1": connected1, "connected2": connected2,
        "fictitious": fictitious,
        "selected_limits_group_1": selected_limits_group_1,
        "selected_limits_group_2": selected_limits_group_2
    }

    return await update_element_generic(
        transformer_id, "two_windings_transformers", network.update_2_windings_transformers,
        update_data, config, repository_manager
    )