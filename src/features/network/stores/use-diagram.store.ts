import { create } from 'zustand';
import { SldMetadata } from '../types/sld-metatada.type';
import { getSingleLineDiagramWithMetadata } from '../api/get-single-line-diagram';
import {
  subscribeSingleLineDiagram,
  unsubscribeSingleLineDiagram,
} from '../api/subscribe-single-line-diagram';
import { SldSubscriptionStatus } from '../types/sld-subscription.type';
import { TeleInformation } from '../types/tele-information.type';

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
  // TODO use my hook here: handleUpdateMessage
  subscribeDiagram: (handler: (ti: TeleInformation) => void) => Promise<void>;
  unsubscribeDiagram: () => Promise<void>;
  subscriptionStatus: SldSubscriptionStatus;
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  svgUrl: null,
  svgBlob: null,
  metadata: null,
  isLoading: false,
  error: null,
  currentLineId: null,
  subscriptionStatus: 'disconnected',

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
    const { subscriptionStatus } = get();
    if (subscriptionStatus === 'connected') {
      get().unsubscribeDiagram();
    }

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

  subscribeDiagram: async (handler) => {
    const { metadata, currentLineId } = get();

    if (!metadata) {
      set({
        error: 'Cannot subscribe: no diagram metadata available',
      });
      return;
    }

    if (!currentLineId) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const response = await subscribeSingleLineDiagram(
        currentLineId,
        metadata,
        handler,
      );
      set({
        isLoading: false,
        subscriptionStatus: response.status,
        error:
          response.status === 'connected'
            ? null
            : 'Failed to connect to ZMQ server',
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Error subscribing to diagram',
        isLoading: false,
        subscriptionStatus: 'disconnected',
      });
    }
  },

  unsubscribeDiagram: async () => {
    const { metadata, currentLineId } = get();

    if (!metadata || !currentLineId) {
      set({
        error: 'Cannot unsubscribe: no diagram metadata available',
      });
      return;
    }

    console.log('UNSCRIBED from store');

    try {
      set({ isLoading: true, error: null });
      const response = await unsubscribeSingleLineDiagram(
        currentLineId,
        metadata,
      );
      set({
        isLoading: false,
        subscriptionStatus: response.status,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Error unsubscribing from diagram',
        isLoading: false,
      });
    }
  },
}));
