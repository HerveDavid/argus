import logging
from typing import Optional

from fastapi import Depends, Form

from app.dependencies import get_config, get_repository
from app.internal.config import ConfigFSM
from app.internal.repository import RepositoryManager
from app.schemas.powsybl import QueryResponse
from . import router, update_element_generic

logger = logging.getLogger(__name__)


@router.post("/three_windings_transformer/{transformer_id}")
async def update_3_windings_transformer(
        transformer_id: str,
        # Side 1
        r1: Optional[float] = Form(None),
        x1: Optional[float] = Form(None),
        g1: Optional[float] = Form(None),
        b1: Optional[float] = Form(None),
        rated_u1: Optional[float] = Form(None),
        rated_s1: Optional[float] = Form(None),
        p1: Optional[float] = Form(None),
        q1: Optional[float] = Form(None),
        connected1: Optional[bool] = Form(None),
        ratio_tap_position1: Optional[int] = Form(None),
        phase_tap_position1: Optional[int] = Form(None),
        selected_limits_group_1: Optional[str] = Form(None),
        # Side 2
        r2: Optional[float] = Form(None),
        x2: Optional[float] = Form(None),
        g2: Optional[float] = Form(None),
        b2: Optional[float] = Form(None),
        rated_u2: Optional[float] = Form(None),
        rated_s2: Optional[float] = Form(None),
        p2: Optional[float] = Form(None),
        q2: Optional[float] = Form(None),
        connected2: Optional[bool] = Form(None),
        ratio_tap_position2: Optional[int] = Form(None),
        phase_tap_position2: Optional[int] = Form(None),
        selected_limits_group_2: Optional[str] = Form(None),
        # Side 3
        r3: Optional[float] = Form(None),
        x3: Optional[float] = Form(None),
        g3: Optional[float] = Form(None),
        b3: Optional[float] = Form(None),
        rated_u3: Optional[float] = Form(None),
        rated_s3: Optional[float] = Form(None),
        p3: Optional[float] = Form(None),
        q3: Optional[float] = Form(None),
        connected3: Optional[bool] = Form(None),
        ratio_tap_position3: Optional[int] = Form(None),
        phase_tap_position3: Optional[int] = Form(None),
        selected_limits_group_3: Optional[str] = Form(None),
        # Common
        fictitious: Optional[bool] = Form(None),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    repo = repository_manager.get_repository_if_ready()
    network = repo.get_network()

    update_data = {
        "r1": r1, "x1": x1, "g1": g1, "b1": b1,
        "rated_u1": rated_u1, "rated_s1": rated_s1, "p1": p1, "q1": q1,
        "connected1": connected1, "ratio_tap_position1": ratio_tap_position1,
        "phase_tap_position1": phase_tap_position1, "selected_limits_group_1": selected_limits_group_1,
        "r2": r2, "x2": x2, "g2": g2, "b2": b2,
        "rated_u2": rated_u2, "rated_s2": rated_s2, "p2": p2, "q2": q2,
        "connected2": connected2, "ratio_tap_position2": ratio_tap_position2,
        "phase_tap_position2": phase_tap_position2, "selected_limits_group_2": selected_limits_group_2,
        "r3": r3, "x3": x3, "g3": g3, "b3": b3,
        "rated_u3": rated_u3, "rated_s3": rated_s3, "p3": p3, "q3": q3,
        "connected3": connected3, "ratio_tap_position3": ratio_tap_position3,
        "phase_tap_position3": phase_tap_position3, "selected_limits_group_3": selected_limits_group_3,
        "fictitious": fictitious
    }

    return await update_element_generic(
        transformer_id, "three_windings_transformers", network.update_3_windings_transformers,
        update_data, config, repository_manager
    )