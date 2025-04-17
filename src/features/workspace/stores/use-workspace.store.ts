import { Substation } from '@/types/substation.type';
import { create } from 'zustand';

// ------------------------------
// Types
// ------------------------------
interface WorkspaceData {
  substations: Map<string, Substation>;
}

export interface WorkspaceStore extends WorkspaceData {
  addSubstation: (substation: Substation) => void;
  removeSubstation: (id: string) => void;
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

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  substations: defaultSubstations,
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
  hasId: (id) => {
    return get().substations.has(id);
  },
}));
