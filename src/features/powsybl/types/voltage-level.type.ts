export interface VoltageLevel {
    high_voltage_limit: number | null;
    id: string;
    low_voltage_limit: number | null;
    name: string;
    nominal_v: number;
    substation_id: string;
    topology_kind: string;
  }
  
  export interface VoltageLevels {
    voltage_levels: VoltageLevel[];
  }