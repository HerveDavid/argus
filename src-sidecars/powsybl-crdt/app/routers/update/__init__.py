from fastapi import APIRouter, Depends
from typing import Optional, Dict, Any, Callable
from fastapi import HTTPException, Depends, Form

from app.dependencies import get_config, get_repository
from ...internal.config import ConfigFSM
from ...internal.repository import RepositoryManager
from ...schemas.powsybl import QueryResponse

router = APIRouter(
    prefix="/powsybl/update",
    tags=["powsybl update"],
    dependencies=[Depends(get_config), Depends(get_repository)],
)


async def update_element_generic(
        element_id: str,
        table_name: str,
        network_update_method: Callable,
        update_data: Dict[str, Any],
        config: ConfigFSM,
        repository_manager: RepositoryManager,
) -> QueryResponse:
    await repository_manager.ensure_repository(config)

    repo = repository_manager.get_repository_if_ready()
    if not repo:
        raise HTTPException(status_code=503, detail="Repository not initialized")

    # Remove None values from update_data
    filtered_update_data = {k: v for k, v in update_data.items() if v is not None}

    if not filtered_update_data:
        raise HTTPException(
            status_code=400,
            detail="At least one parameter must be provided for update"
        )

    try:
        network = repo.get_network()

        # 1. Update pypowsybl network
        network_update_kwargs = {"id": element_id, **filtered_update_data}
        network_update_method(**network_update_kwargs)

        # 2. Update database
        element_repository = repo.get_repository(table_name)

        # Build dynamic SQL UPDATE query
        set_clauses = [f"{field} = ?" for field in filtered_update_data.keys()]
        parameters = list(filtered_update_data.values()) + [element_id]

        update_query = f"""
            UPDATE {table_name} 
            SET {', '.join(set_clauses)}
            WHERE id = ?
        """

        element_repository.execute_query(update_query, parameters)

        # Get updated data
        select_result = element_repository.execute_query(
            f"SELECT * FROM {table_name} WHERE id = ?", [element_id]
        )

        if not select_result:
            raise HTTPException(
                status_code=404,
                detail=f"Element with id '{element_id}' not found in {table_name}"
            )

        return QueryResponse(
            success=True,
            data=select_result,
            row_count=len(select_result),
            columns=list(select_result[0].keys()) if select_result else [],
            message=f"{table_name} {element_id} updated successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        return QueryResponse(
            success=False,
            error=str(e),
            message=f"Failed to update {table_name} {element_id}"
        )

from . import battery
from . import bus
from . import dangling_line
from . import generator
from . import hvdc_line
from . import line
from . import load
from . import switch
from . import two_windings_transformer
from . import three_windings_transformer
from . import voltage_level
from . import lcc_converter_station
from . import linear_shunt_compensator_section
from . import non_linear_shunt_compensator_section
from . import phase_tab_changer
from . import ratio_tab_changer
from . import shunt_compensator
from . import static_var_compensator
from . import substation
from . import vsc_converter_station
from . import area
