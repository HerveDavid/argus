import { create } from 'zustand';
import { SldMetadata } from '../types/sld-metatada.type';
import { getSingleLineDiagramWithMetadata } from '../api/get-single-line-diagram';

export interface DiagramData {
  svgUrl: string | null;
  svgBlob: Blob | null;
  metadata: SldMetadata | null;
  isLoading: boolean;
  error: string | null;
  currentLineId: string | null;
}

interface DiagramStore extends DiagramData {
  loadDiagram: (lineId: string) => Promise<void>;
  resetDiagram: () => void;
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  svgUrl: null,
  svgBlob: null,
  metadata: null,
  isLoading: false,
  error: null,
  currentLineId: null,

  loadDiagram: async (lineId: string) => {
    // Vérifier si on a déjà chargé ce diagramme
    const { currentLineId } = get();

    // Si c'est le même diagramme, ne rien faire
    if (lineId === currentLineId) {
      return;
    }

    // Sinon, charger le nouveau diagramme
    set({ isLoading: true, error: null });

    try {
      const { svgBlob, metadata } = await getSingleLineDiagramWithMetadata(
        lineId,
      );
      const svgUrl = URL.createObjectURL(svgBlob);

      // Libérer l'URL précédente si elle existe
      const prevState = get();
      if (prevState.svgUrl) {
        URL.revokeObjectURL(prevState.svgUrl);
      }

      set({
        svgBlob,
        metadata,
        svgUrl,
        isLoading: false,
        currentLineId: lineId,
      });
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
      // Révoquer l'URL pour éviter les fuites de mémoire
      if (state.svgUrl) {
        URL.revokeObjectURL(state.svgUrl);
      }

      return {
        svgUrl: null,
        svgBlob: null,
        metadata: null,
        error: null,
        currentLineId: null,
      };
    });
  },
}));
