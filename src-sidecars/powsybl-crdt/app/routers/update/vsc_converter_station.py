import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/vsc_converter_station/{station_id}")
async def update_vsc_converter_station(
        station_id: str,
        loss_factor: Optional[float] = Form(None),
        target_v: Optional[float] = Form(None),
        target_q: Optional[float] = Form(None),
        voltage_regulator_on: Optional[bool] = Form(None),
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
        "loss_factor": loss_factor,
        "target_v": target_v, "target_q": target_q,
        "voltage_regulator_on": voltage_regulator_on,
        "p": p, "q": q, "connected": connected,
        "regulated_element_id": regulated_element_id,
        "fictitious": fictitious
    }

    return await update_element_generic(
        station_id, "vsc_converter_stations", network.update_vsc_converter_stations,
        update_data, config, repository_manager
    )