// stores/equipment-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EquipmentStore {
  // État
  searchTerm: string;
  currentPage: number;
  expandedSubstations: Set<string>;
  pageSize: number;
  
  // Actions
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  toggleSubstation: (substationId: string) => void;
  setExpandedSubstations: (expanded: Set<string>) => void;
  handleSearch: (value: string) => void;
  handlePageChange: (page: number) => void;
  resetFilters: () => void;
}

// État initial
const initialState = {
  searchTerm: '',
  currentPage: 1,
  expandedSubstations: new Set<string>(),
  pageSize: 12,
};

export const useEquipmentStore = create<EquipmentStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setSearchTerm: (term: string) => 
        set({ searchTerm: term }),
      
      setCurrentPage: (page: number) => 
        set({ currentPage: page }),
      
      toggleSubstation: (substationId: string) => {
        const { expandedSubstations } = get();
        const newExpanded = new Set(expandedSubstations);
        
        if (newExpanded.has(substationId)) {
          newExpanded.delete(substationId);
        } else {
          newExpanded.add(substationId);
        }
        
        set({ expandedSubstations: newExpanded });
      },
      
      setExpandedSubstations: (expanded: Set<string>) => 
        set({ expandedSubstations: expanded }),
      
      handleSearch: (value: string) => 
        set({ 
          searchTerm: value, 
          currentPage: 1 // Reset à la page 1 lors d'une nouvelle recherche
        }),
      
      handlePageChange: (page: number) => 
        set({ currentPage: page }),
      
      resetFilters: () => 
        set({ 
          searchTerm: '', 
          currentPage: 1, 
          expandedSubstations: new Set<string>() 
        }),
    }),
    {
      name: 'equipment-explorer-storage',
      // Configuration pour la persistance
      partialize: (state) => ({
        searchTerm: state.searchTerm,
        currentPage: state.currentPage,
        // Note: Set n'est pas sérialisable, on le convertit en array
        expandedSubstations: Array.from(state.expandedSubstations),
      }),
      // Fonction pour reconstituer l'état depuis le localStorage
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.expandedSubstations)) {
          state.expandedSubstations = new Set(state.expandedSubstations as string[]);
        }
      },
    }
  )
);