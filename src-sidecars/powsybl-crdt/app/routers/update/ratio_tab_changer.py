import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/ratio_tap_changer/{changer_id}")
async def update_ratio_tap_changer(
        changer_id: str,
        tap: Optional[int] = Form(None),
        on_load: Optional[bool] = Form(None),
        regulating: Optional[bool] = Form(None),
        regulated_side: Optional[str] = Form(None),
        target_v: Optional[float] = Form(None),
        target_deadband: Optional[float] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "tap": tap,
        "on_load": on_load,
        "regulating": regulating,
        "regulated_side": regulated_side,
        "target_v": target_v,
        "target_deadband": target_deadband
    }

    return await update_element_generic(
        changer_id, "ratio_tap_changers", network.update_ratio_tap_changers,
        update_data, config, repository_manager
    )