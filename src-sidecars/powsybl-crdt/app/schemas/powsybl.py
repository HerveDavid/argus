from typing import Optional, List, Any, Dict, Union

from pydantic import BaseModel, Field


class SQLQueryRequest(BaseModel):
    query: str = Field(..., description="SQL query to execute")
    parameters: Optional[List[Any]] = Field(None, description="Query parameters for prepared statements")
    limit: Optional[int] = Field(100, description="Maximum number of rows to return", ge=1, le=10000)

class TableInfoResponse(BaseModel):
    table_name: str
    exists: bool
    row_count: int
    columns: List[str]

class QueryResponse(BaseModel):
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    row_count: Optional[int] = None
    columns: Optional[List[str]] = None

class DiagramResponse(BaseModel):
    success: bool = Field(..., description="Whether the diagram generation was successful")
    svg_content: Optional[str] = Field(None, description="SVG content of the generated diagram")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Diagram metadata including layout parameters and node/edge information")
    error: Optional[str] = Field(None, description="Error message if generation failed")

class SingleLineDiagramResponse(DiagramResponse):
    element_id: Optional[str] = Field(None, description="ID of the element for which the diagram was generated")

class NetworkAreaDiagramResponse(DiagramResponse):
    voltage_level_ids: Optional[Union[str, List[str]]] = Field(None, description="Voltage level ID(s) used as center of the diagram")
    depth: Optional[int] = Field(None, description="Diagram depth around the voltage levels")
    high_nominal_voltage_bound: Optional[float] = Field(None, description="High voltage bound filter applied")
    low_nominal_voltage_bound: Optional[float] = Field(None, description="Low voltage bound filter applied")
