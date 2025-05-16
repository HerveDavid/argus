import { Substation } from '@/types/substation.type';
import { VoltageLevel } from '@/types/voltage-level.type';
import { create } from 'zustand';

// ------------------------------
// Types
// ------------------------------
interface WorkspaceData {
  substations: Map<string, Substation>;
  voltageLevels: Map<string, VoltageLevel>;
}

export interface WorkspaceStore extends WorkspaceData {
  addSubstation: (substation: Substation) => void;
  removeSubstation: (id: string) => void;
  addVoltageLevel: (voltageLevel: VoltageLevel) => void;
  removeVoltageLevel: (id: string) => void;
  hasId: (id: string) => boolean;
}

// ------------------------------
// Store
// ------------------------------

const defaultSubstations = new Map<string, Substation>();
defaultSubstations.set('MQIS', {
  country: 'FR',
  geo_tags: '',
  id: 'MQIS',
  name: '',
  tso: 'FR',
});

const defaultVoltageLevels = new Map<string, VoltageLevel>();
defaultVoltageLevels.set('MQIS P6', {
  high_voltage_limit: 245,
  id: 'MQIS P6',
  low_voltage_limit: 220,
  name: '',
  nominal_v: 225,
  substation_id: 'MQIS',
  topology_kind: '',
});
defaultVoltageLevels.set('MQIS P7', {
  high_voltage_limit: 245,
  id: 'MQIS P7',
  low_voltage_limit: 220,
  name: '',
  nominal_v: 225,
  substation_id: 'MQIS',
  topology_kind: '',
});
defaultVoltageLevels.set('MQIS P3', {
  high_voltage_limit: 245,
  id: 'MQIS P3',
  low_voltage_limit: 220,
  name: '',
  nominal_v: 225,
  substation_id: 'MQIS',
  topology_kind: '',
});
defaultVoltageLevels.set('MQIS P1', {
  high_voltage_limit: 245,
  id: 'MQIS P1',
  low_voltage_limit: 220,
  name: '',
  nominal_v: 225,
  substation_id: 'MQIS',
  topology_kind: '',
});


export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  substations: defaultSubstations,
  voltageLevels: defaultVoltageLevels,
  addSubstation: (substation) => {
    set((state) => {
      const newSubstations = new Map(state.substations);
      newSubstations.set(substation.id, substation);
      return { substations: newSubstations };
    });
  },
  removeSubstation: (id) => {
    set((state) => {
      const newSubstations = new Map(state.substations);
      newSubstations.delete(id);
      return { substations: newSubstations };
    });
  },
  addVoltageLevel: (voltageLevel) => {
    set((state) => {
      const newVoltageLevels = new Map(state.voltageLevels);
      newVoltageLevels.set(voltageLevel.id, voltageLevel);
      return { voltageLevels: newVoltageLevels };
    });
  },
  removeVoltageLevel: (id) => {
    set((state) => {
      const newVoltageLevels = new Map(state.voltageLevels);
      newVoltageLevels.delete(id);
      return { voltageLevels: newVoltageLevels };
    });
  },
  hasId: (id) => {
    return get().substations.has(id) || get().voltageLevels.has(id);
  },
}));
