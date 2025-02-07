import { create } from 'zustand';
import { MetadataGrid } from '../types/metadata-grid';
import { getMetadataGrid } from '../api/get-metadata-grid';
import { TreeViewElement } from '@/components/ui/tree-view';

interface MetadataGridState {
  grid: MetadataGrid | null;
  treeElements: TreeViewElement[];
  expandedItems: string[];
  loading: boolean;
  error: Error | null;
  selectedId: string | null;
  
  // Actions
  fetchGrid: () => Promise<void>;
  setSelectedId: (id: string) => void;
  setExpandedItems: (items: string[]) => void;
  getTreeElements: () => TreeViewElement[];
}

export const useMetadataGridStore = create<MetadataGridState>((set, get) => ({
  // État initial
  grid: null,
  treeElements: [],
  expandedItems: ['nodes', 'busNodes', 'edges'],
  loading: false,
  error: null,
  selectedId: null,

  // Actions
  fetchGrid: async () => {
    set({ loading: true });
    try {
      const { data } = await getMetadataGrid();
      
      // Création des éléments d'arbre
      const treeElements = [
        {
          id: 'nodes',
          name: 'Nodes',
          isSelectable: true,
          children: data.nodes?.map(node => ({
            id: node.svgId,
            name: `${node.equipmentId} (${node.x.toFixed(2)}, ${node.y.toFixed(2)})`,
            isSelectable: true,
          })) || [],
        },
        {
          id: 'busNodes',
          name: 'Bus Nodes',
          isSelectable: true,
          children: data.busNodes?.map(node => ({
            id: node.svgId,
            name: `${node.equipmentId} (Neighbours: ${node.nbNeighbours})`,
            isSelectable: true,
          })) || [],
        },
        {
          id: 'edges',
          name: 'Edges',
          isSelectable: true,
          children: data.edges?.map(edge => ({
            id: edge.svgId,
            name: `${edge.equipmentId} (${edge.type})`,
            isSelectable: true,
          })) || [],
        },
      ];

      set({ 
        grid: data, 
        treeElements,
        error: null 
      });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err : new Error('Failed to fetch metadata grid'),
        grid: null,
        treeElements: []
      });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedId: (id: string) => {
    set({ selectedId: id });
  },

  setExpandedItems: (items: string[]) => {
    set({ expandedItems: items });
  },

  getTreeElements: () => {
    return get().treeElements;
  },
}));

// Sélecteurs optimisés pour les performances
export const selectLoading = (state: MetadataGridState) => state.loading;
export const selectError = (state: MetadataGridState) => state.error;
export const selectTreeElements = (state: MetadataGridState) => state.treeElements;
export const selectExpandedItems = (state: MetadataGridState) => state.expandedItems;
export const selectSelectedId = (state: MetadataGridState) => state.selectedId;