export interface Substation {
  id: string;
  name: string;
  tso: string;
  geo_tags: string;
  country: string;
  fictitious: boolean;
  voltage_levels: VoltageLevel[];
}

export interface VoltageLevel {
  id: string;
  name: string;
  substation_id: string;
  nominal_v: number | null;
  high_voltage_limit: number | null;
  low_voltage_limit: number | null;
  fictitious: boolean;
  topology_kind: string;
}

export interface SubstationQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  tso?: string;
}

export interface SubstationQueryResponse {
  substations: Substation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}