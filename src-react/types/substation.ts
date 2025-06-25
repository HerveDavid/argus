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
  nominal_v: number;
  high_voltage_limit: number;
  low_voltage_limit: number;
  fictitious: boolean;
  topology_kind: string;
}

export interface Substations {
  substations: Substation[];
}
