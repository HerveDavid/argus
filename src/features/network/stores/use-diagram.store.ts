import { create } from 'zustand';
import { MetadataGrid } from '../types/metadata-diagram.type';
import { getSingleLineDiagramWithMetadata } from '../api/get-single-line-diagram';

export interface DiagramData {
  svgUrl: string | null;
  svgBlob: Blob | null;
  metadata: MetadataGrid | null;
  isLoading: boolean;
  error: string | null;
}

interface DiagramStore extends DiagramData {
  loadDiagram: (lineId: string) => Promise<void>;
  resetDiagram: () => void;
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  svgUrl: null,
  svgBlob: null,
  metadata: null,
  isLoading: false,
  error: null,

  loadDiagram: async (lineId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { svgBlob, metadata } = await getSingleLineDiagramWithMetadata(
        lineId,
      );
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
}));
