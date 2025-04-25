import { create } from 'zustand';
import { DiagramStore } from './use-diagram.store';

export interface RegistrySldData {
  stores: Map<string, DiagramStore>;
}

interface RegistrySldStore extends RegistrySldData {
  register: (id: string) => void;
  remove: (id: string) => void;
  getSld: (id: string) => DiagramStore;
  hasSld: (id: string) => boolean;
  getIds: () => [string];
}

export const useRegistrySldStore = create();
