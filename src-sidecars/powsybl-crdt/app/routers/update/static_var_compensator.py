import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/static_var_compensator/{svc_id}")
async def update_static_var_compensator(
        svc_id: str,
        b_min: Optional[float] = Form(None),
        b_max: Optional[float] = Form(None),
        target_v: Optional[float] = Form(None),
        target_q: Optional[float] = Form(None),
        regulation_mode: Optional[str] = Form(None),
        p: Optional[float] = Form(None),
        q: Optional[float] = Form(None),
        connected: Optional[bool] = Form(None),
        regulated_element_id: Optional[str] = Form(None),
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "b_min": b_min, "b_max": b_max,
        "target_v": target_v, "target_q": target_q,
        "regulation_mode": regulation_mode,
        "p": p, "q": q, "connected": connected,
        "regulated_element_id": regulated_element_id,
        "fictitious": fictitious
    }

    return await update_element_generic(
        svc_id, "static_var_compensators", network.update_static_var_compensators,
        update_data, config, repository_manager
    )