import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/generator/{generator_id}")
async def update_generator(
        generator_id: str,
        target_p: Optional[float] = Form(None),
        max_p: Optional[float] = Form(None),
        min_p: Optional[float] = Form(None),
        rated_s: Optional[float] = Form(None),
        target_v: Optional[float] = Form(None),
        target_q: Optional[float] = Form(None),
        voltage_regulator_on: Optional[bool] = Form(None),
        regulated_element_id: Optional[str] = Form(None),
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
        "target_p": target_p, "max_p": max_p, "min_p": min_p,
        "rated_s": rated_s, "target_v": target_v, "target_q": target_q,
        "voltage_regulator_on": voltage_regulator_on,
        "regulated_element_id": regulated_element_id,
        "p": p, "q": q, "connected": connected, "fictitious": fictitious
    }

    return await update_element_generic(
        generator_id, "generators", network.update_generators,
        update_data, config, repository_manager
    )