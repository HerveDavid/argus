import { create } from 'zustand';
import { MetadataGrid } from '../types/sld-metatada';
import { getNetworkAreaDiagramWithMetadata } from '../api/get-network-area-diagram';

export interface NetworkAreaDiagramData {
  svgUrl: string | null;
  svgBlob: Blob | null;
  metadata: MetadataGrid | null;
  isLoading: boolean;
  error: string | null;
}

interface NetworkAreaDiagramStore extends NetworkAreaDiagramData {
  loadDiagram: () => Promise<void>;
  resetDiagram: () => void;
}

export const useNetworkAreaDiagramStore = create<NetworkAreaDiagramStore>(
  (set) => ({
    svgUrl: null,
    svgBlob: null,
    metadata: null,
    isLoading: false,
    error: null,

    loadDiagram: async () => {
      set({ isLoading: true, error: null });
      try {
        const { svgBlob, metadata } = await getNetworkAreaDiagramWithMetadata();
        const svgUrl = URL.createObjectURL(svgBlob);
        set({ svgBlob, metadata, svgUrl, isLoading: false });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
          isLoading: false,
        });
      }
    },

    resetDiagram: () => {
      set((state) => {
        // Revoke object URL to prevent memory leaks
        if (state.svgUrl) {
          URL.revokeObjectURL(state.svgUrl);
        }
        return {
          svgUrl: null,
          svgBlob: null,
          metadata: null,
          error: null,
        };
      });
    },
  }),
);
