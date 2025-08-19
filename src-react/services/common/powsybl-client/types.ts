import { SldDiagram } from "@/types/sld-diagram";

export interface TableInfoResponse {
  table_name: string;
  exists: boolean;
  row_count: number;
  columns: string[];
}

export interface QueryResponse {
  success: boolean;
  data?: Record<string, any>[] | null;
  error?: string | null;
  row_count?: number | null;
  columns?: string[] | null;
}

export interface SQLQueryRequest {
  query: string;
  parameters?: any[] | null;
  limit?: number | null;
}

export interface SingleLineDiagramResponse {
  success: boolean;
  svg_content?: string | null;
  metadata?: SldDiagram| null;
  error?: string | null;
  element_id?: string | null;
}

export interface NetworkAreaDiagramResponse {
  success: boolean;
  svg_content?: string | null;
  metadata?: Record<string, any> | null;
  error?: string | null;
  voltage_level_ids?: string | string[] | null;
  depth?: number | null;
  high_nominal_voltage_bound?: number | null;
  low_nominal_voltage_bound?: number | null;
}

export interface GetSingleLineDiagramRequest {
  element_id: string;
}

export interface GetNetworkAreaDiagramRequest {
  voltage_level_ids?: string;
  depth?: number;
  high_nominal_voltage_bound?: number;
  low_nominal_voltage_bound?: number;
}

export interface ExecuteQueryRequest {
  query: string;
  parameters?: any[];
  limit?: number;
}

export interface UpdateSwitchRequest {
  switch_id: string;
  open: boolean;
  retained?: boolean;
  fictitious?: boolean;
}
