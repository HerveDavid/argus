import logging
import json
import numpy as np
from typing import List, Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.encoders import jsonable_encoder

from app.internal.config import ConfigFSM
from ..dependencies import get_config, get_repository
from ..internal.repository import RepositoryManager
from ..schemas.powsybl import SQLQueryRequest, TableInfoResponse, QueryResponse, SingleLineDiagramResponse, \
    NetworkAreaDiagramResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/powsybl",
    tags=["powsybl"],
    dependencies=[Depends(get_config), Depends(get_repository)],
)


def serialize_numpy_data(data: Any) -> Any:
    """
    Convertit récursivement les objets numpy en types Python natifs
    pour la sérialisation JSON/Pydantic
    """
    if isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, np.integer):
        return int(data)
    elif isinstance(data, np.floating):
        return float(data)
    elif isinstance(data, np.bool_):
        return bool(data)
    elif isinstance(data, dict):
        return {key: serialize_numpy_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [serialize_numpy_data(item) for item in data]
    elif isinstance(data, tuple):
        return tuple(serialize_numpy_data(item) for item in data)
    else:
        return data


@router.get("/tables")
async def get_tables(
        config: ConfigFSM = Depends(get_config),
        repository: RepositoryManager = Depends(get_repository),
) -> List[TableInfoResponse]:
    await repository.ensure_repository(config)
    repo = repository.get_repository_if_ready()

    if not repo:
        raise HTTPException(status_code=503, detail="Repository not initialized")

    table_info = []
    repository_names = [
        "substations", "voltage_levels", "lines", "three_windings_transformers",
        "two_windings_transformers", "aliases", "areas", "areas_boundaries",
        "areas_voltage_levels", "batteries", "branches", "busbar_sections",
        "buses", "bus_breaker_view_buses", "dangling_lines", "generators",
        "hvdc_lines", "identifiables", "injections", "lcc_converter_stations",
        "loads", "linear_shunt_compensator_sections",
        "non_linear_shunt_compensator_sections", "operational_limits",
        "phase_tab_changer_steps", "phase_tab_changers", "ratio_tab_changer_steps",
        "ratio_tab_changers", "reactive_capability_curve_points",
        "shunt_compensators", "static_var_compensators", "switches",
        "terminals", "vsc_converter_stations", "tie_lines", "game_master_outputs", "scada_outputs", "scada_inputs"
    ]

    for repo_name in repository_names:
        try:
            repository_obj = repo.get_repository(repo_name)
            info = repository_obj.get_table_info()

            # Sérialiser les données numpy
            serialized_info = serialize_numpy_data(info)

            table_info.append(TableInfoResponse(
                table_name=serialized_info["table_name"],
                exists=serialized_info["exists"],
                row_count=serialized_info["count"],
                columns=serialized_info["columns"]
            ))
        except Exception as e:
            logger.warning(f"Could not get info for repository {repo_name}: {e}")

    return table_info


@router.get("/table/{table_name}")
async def get_table_data(
        table_name: str,
        limit: int = Query(100, ge=1, le=10000, description="Maximum number of rows to return"),
        offset: int = Query(0, ge=0, description="Number of rows to skip"),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    await repository_manager.ensure_repository(config)

    repo = repository_manager.get_repository_if_ready()
    if not repo:
        raise HTTPException(
            status_code=503,
            detail="Repository not initialized"
        )

    try:
        repository_obj = repo.get_repository(table_name)
        query = f"SELECT * FROM {repository_obj.get_table_name()} LIMIT {limit} OFFSET {offset}"

        results = repository_obj.execute_query(query)

        # Sérialiser les données numpy
        serialized_results = serialize_numpy_data(results)
        columns = serialize_numpy_data(repository_obj.get_columns())

        return QueryResponse(
            success=True,
            data=serialized_results,
            row_count=len(serialized_results),
            columns=columns
        )
    except Exception as e:
        logger.error(f"Error querying table {table_name}: {e}")
        return QueryResponse(
            success=False,
            error=str(e)
        )


@router.post("/query")
async def execute_query(
        request: SQLQueryRequest,
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    await repository_manager.ensure_repository(config)

    repo = repository_manager.get_repository_if_ready()
    if not repo:
        raise HTTPException(
            status_code=503,
            detail="Repository not initialized"
        )

    # Basic SQL injection prevention - reject certain dangerous keywords
    dangerous_keywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE']
    query_upper = request.query.upper()

    for keyword in dangerous_keywords:
        if keyword in query_upper:
            raise HTTPException(
                status_code=400,
                detail=f"Query contains forbidden keyword: {keyword}. Only SELECT queries are allowed."
            )

    try:
        # Get connection from any repository (they all share the same connection)
        # We'll use the substations repository as an example
        repository_obj = repo.get_repository("substations")

        # Apply limit if not specified in query
        if request.limit and 'LIMIT' not in query_upper:
            request.query += f" LIMIT {request.limit}"

        # Execute the query
        results = repository_obj.execute_query(request.query, request.parameters)

        # Sérialiser les données numpy
        serialized_results = serialize_numpy_data(results)

        # Get column names from the first result if available
        columns = list(serialized_results[0].keys()) if serialized_results else []

        return QueryResponse(
            success=True,
            data=serialized_results,
            row_count=len(serialized_results),
            columns=columns
        )
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        return QueryResponse(
            success=False,
            error=str(e)
        )


@router.get("/table/{table_name}/search")
async def search_table(
        table_name: str,
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
        limit: int = Query(100, ge=1, le=10000),
        filters: str = Query(..., description="JSON string containing search filters")
) -> QueryResponse:
    await repository_manager.ensure_repository(config)

    repo = repository_manager.get_repository_if_ready()
    if not repo:
        raise HTTPException(
            status_code=503,
            detail="Repository not initialized"
        )

    try:
        repository_obj = repo.get_repository(table_name)

        # Parse filters from JSON string
        try:
            filter_dict = json.loads(filters)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid JSON format for filters parameter"
            )

        # Convert string filters to appropriate types
        processed_filters = {}
        for key, value in filter_dict.items():
            if isinstance(value, str):
                if value.lower() == 'true':
                    processed_filters[key] = True
                elif value.lower() == 'false':
                    processed_filters[key] = False
                elif value.lower() == 'null' or value.lower() == 'none':
                    processed_filters[key] = None
                else:
                    # Try to convert to number if possible
                    try:
                        if '.' in value:
                            processed_filters[key] = float(value)
                        else:
                            processed_filters[key] = int(value)
                    except ValueError:
                        processed_filters[key] = value
            else:
                processed_filters[key] = value

        # Search with filters
        results = repository_obj.search(processed_filters, limit=limit)

        # Sérialiser les données numpy
        serialized_results = serialize_numpy_data(results)
        columns = serialize_numpy_data(repository_obj.get_columns())

        return QueryResponse(
            success=True,
            data=serialized_results,
            row_count=len(serialized_results),
            columns=columns
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching table {table_name}: {e}")
        return QueryResponse(
            success=False,
            error=str(e)
        )


@router.get("/table/{table_name}/item/{item_id}")
async def get_item_by_id(
        table_name: str,
        item_id: str,
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> QueryResponse:
    await repository_manager.ensure_repository(config)

    repo = repository_manager.get_repository_if_ready()
    if not repo:
        raise HTTPException(
            status_code=503,
            detail="Repository not initialized"
        )

    try:
        repository_obj = repo.get_repository(table_name)
        result = repository_obj.get_by_id(item_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Item with id '{item_id}' not found in table '{table_name}'"
            )

        # Sérialiser les données numpy
        serialized_result = serialize_numpy_data(result)
        columns = serialize_numpy_data(repository_obj.get_columns())

        return QueryResponse(
            success=True,
            data=[serialized_result],
            row_count=1,
            columns=columns
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting item {item_id} from table {table_name}: {e}")
        return QueryResponse(
            success=False,
            error=str(e)
        )


@router.get("/stats")
async def get_database_stats(
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> Dict[str, Any]:
    await repository_manager.ensure_repository(config)

    repo = repository_manager.get_repository_if_ready()
    if not repo:
        raise HTTPException(
            status_code=503,
            detail="Repository not initialized"
        )

    stats = {
        "repository_status": repository_manager.get_status(),
        "tables": {},
        "total_rows": 0,
        "total_tables": 0
    }

    repository_names = [
        "substations", "voltage_levels", "lines", "three_windings_transformers",
        "two_windings_transformers", "aliases", "areas", "areas_boundaries",
        "areas_voltage_levels", "batteries", "branches", "busbar_sections",
        "buses", "bus_breaker_view_buses", "dangling_lines", "generators",
        "hvdc_lines", "identifiables", "injections", "lcc_converter_stations",
        "loads", "linear_shunt_compensator_sections",
        "non_linear_shunt_compensator_sections", "operational_limits",
        "phase_tab_changer_steps", "phase_tab_changers", "ratio_tab_changer_steps",
        "ratio_tab_changers", "reactive_capability_curve_points",
        "shunt_compensators", "static_var_compensators", "switches",
        "terminals", "vsc_converter_stations", "tie_lines", "game_master_outputs", "scada_outputs"
    ]

    for repo_name in repository_names:
        try:
            repository_obj = repo.get_repository(repo_name)
            info = repository_obj.get_table_info()

            # Sérialiser les données numpy
            serialized_info = serialize_numpy_data(info)

            if serialized_info["exists"]:
                stats["tables"][serialized_info["table_name"]] = {
                    "row_count": serialized_info["count"],
                    "column_count": len(serialized_info["columns"])
                }
                stats["total_rows"] += serialized_info["count"]
                stats["total_tables"] += 1
        except Exception as e:
            logger.warning(f"Could not get stats for {repo_name}: {e}")

    # Sérialiser les stats finales
    return serialize_numpy_data(stats)


@router.get("/single_line_diagram/{element_id}", response_model=SingleLineDiagramResponse)
async def get_single_line_diagram(
        element_id: str,
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> SingleLineDiagramResponse:
    await repository_manager.ensure_repository(config)
    repo = repository_manager.get_diagram_manager_if_ready()
    if not repo:
        raise HTTPException(
            status_code=503,
            detail="Repository not initialized"
        )

    svg_content, metadata = await repo.generate_single_line_diagram(element_id)

    # Sérialiser les métadonnées
    serialized_metadata = serialize_numpy_data(metadata) if metadata else None

    if svg_content is None:
        return SingleLineDiagramResponse(
            success=False,
            element_id=element_id,
            error=serialized_metadata.get("error", "Unknown error") if serialized_metadata else "Unknown error"
        )

    return SingleLineDiagramResponse(
        success=True,
        element_id=element_id,
        svg_content=svg_content,
        metadata=serialized_metadata
    )


@router.get("/network_area_diagram", response_model=NetworkAreaDiagramResponse)
async def get_network_area_diagram(
        voltage_level_ids: Optional[str] = Query(None, description="Voltage level ID(s), comma-separated for multiple"),
        depth: int = Query(0, description="Diagram depth around the voltage level"),
        high_nominal_voltage_bound: float = Query(-1,
                                                  description="High bound to filter voltage level according to nominal voltage"),
        low_nominal_voltage_bound: float = Query(-1,
                                                 description="Low bound to filter voltage level according to nominal voltage"),
        config: ConfigFSM = Depends(get_config),
        repository_manager: RepositoryManager = Depends(get_repository),
) -> NetworkAreaDiagramResponse:
    await repository_manager.ensure_repository(config)
    repo = repository_manager.get_diagram_manager_if_ready()
    if not repo:
        raise HTTPException(
            status_code=503,
            detail="Repository not initialized"
        )

    vl_ids = None
    if voltage_level_ids:
        vl_ids_list = [vl_id.strip() for vl_id in voltage_level_ids.split(',')]
        vl_ids = vl_ids_list[0] if len(vl_ids_list) == 1 else vl_ids_list

    svg_content, metadata = await repo.generate_network_area_diagram(
        voltage_level_ids=vl_ids,
        depth=depth,
        high_nominal_voltage_bound=high_nominal_voltage_bound,
        low_nominal_voltage_bound=low_nominal_voltage_bound
    )

    # Sérialiser les métadonnées
    serialized_metadata = serialize_numpy_data(metadata) if metadata else None

    if svg_content is None:
        return NetworkAreaDiagramResponse(
            success=False,
            voltage_level_ids=vl_ids,
            depth=depth,
            high_nominal_voltage_bound=high_nominal_voltage_bound if high_nominal_voltage_bound != -1 else None,
            low_nominal_voltage_bound=low_nominal_voltage_bound if low_nominal_voltage_bound != -1 else None,
            error=serialized_metadata.get("error", "Unknown error") if serialized_metadata else "Unknown error"
        )

    return NetworkAreaDiagramResponse(
        success=True,
        voltage_level_ids=vl_ids,
        depth=depth,
        high_nominal_voltage_bound=high_nominal_voltage_bound if high_nominal_voltage_bound != -1 else None,
        low_nominal_voltage_bound=low_nominal_voltage_bound if low_nominal_voltage_bound != -1 else None,
        svg_content=svg_content,
        metadata=serialized_metadata
    )