import { create } from 'zustand';
import { Effect } from 'effect';
import { SldMetadata } from '../types/sld-metatada.type';
import { getSingleLineDiagramWithMetadata } from '../api/get-single-line-diagram';
import { SldSubscriptionStatus } from '../types/sld-subscription.type';
import { TeleInformation } from '../types/tele-information.type';
import {
  subscribeSLD,
  unsubscribeSLD,
} from '../services/subscription-ti.service';

// ------------------------------
// Types
// ------------------------------
export interface DiagramData {
  svgUrl: string | null;
  svgBlob: Blob | null;
  metadata: SldMetadata | null;
  isLoading: boolean;
  error: string | null;
  currentLineId: string | null;
}

export interface DiagramStore extends DiagramData {
  loadDiagram: (lineId: string) => Promise<void>;
  resetDiagram: () => void;
  subscribeDiagram: (handler: (ti: TeleInformation) => void) => void;
  unsubscribeDiagram: () => void;
  subscriptionStatus: SldSubscriptionStatus;
}

// ------------------------------
// Store
// ------------------------------
export const useDiagramStore = create<DiagramStore>((set, get) => ({
  // État initial
  svgUrl: null,
  svgBlob: null,
  metadata: null,
  isLoading: false,
  error: null,
  currentLineId: null,
  subscriptionStatus: 'disconnected',

  /**
   * Charge un diagramme à partir de son ID
   */
  loadDiagram: async (lineId: string) => {
    const { currentLineId } = get();

    // Ne rien faire si c'est le même diagramme
    if (lineId === currentLineId) return;

    set({ isLoading: true, error: null });

    try {
      // Récupération du diagramme
      const { svgBlob, metadata } = await getSingleLineDiagramWithMetadata(
        lineId,
      );
      const svgUrl = URL.createObjectURL(svgBlob);

      // Libérer l'URL précédente si elle existe
      const prevUrl = get().svgUrl;
      if (prevUrl) URL.revokeObjectURL(prevUrl);

      // Mise à jour du state
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

  /**
   * Réinitialise l'état du diagramme
   */
  resetDiagram: () => {
    const { subscriptionStatus, unsubscribeDiagram, svgUrl } = get();

    // Se désabonner si connecté
    if (subscriptionStatus === 'connected') {
      unsubscribeDiagram();
    }

    // Libérer l'URL pour éviter les fuites de mémoire
    if (svgUrl) URL.revokeObjectURL(svgUrl);

    // Réinitialisation du state
    set({
      svgUrl: null,
      svgBlob: null,
      metadata: null,
      error: null,
      currentLineId: null,
    });
  },

  /**
   * S'abonne aux mises à jour du diagramme
   */
  subscribeDiagram: (handler) => {
    const { metadata, currentLineId } = get();

    if (!metadata || !currentLineId) {
      set({ error: 'Cannot subscribe: no diagram metadata available' });
      return;
    }

    set({ isLoading: true, error: null });

    // Utilisation de runPromise comme recommandé dans les best practices
    Effect.runPromise(subscribeSLD(currentLineId, metadata, handler))
      .then((response) => {
        set({
          isLoading: false,
          subscriptionStatus: response.status,
          error:
            response.status === 'connected'
              ? null
              : 'Failed to connect to ZMQ server',
        });
      })
      .catch((error) => {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Error subscribing to diagram',
          isLoading: false,
          subscriptionStatus: 'disconnected',
        });
      });
  },

  /**
   * Se désabonne des mises à jour du diagramme
   */
  unsubscribeDiagram: () => {
    const { metadata, currentLineId } = get();

    if (!metadata || !currentLineId) {
      set({ error: 'Cannot unsubscribe: no diagram metadata available' });
      return;
    }

    set({ isLoading: true, error: null });

    // Utilisation de runPromise comme recommandé dans les best practices
    Effect.runPromise(unsubscribeSLD(currentLineId, metadata))
      .then((response) => {
        set({
          isLoading: false,
          subscriptionStatus: response.status,
        });
      })
      .catch((error) => {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Error unsubscribing from diagram',
          isLoading: false,
        });
      });
  },
}));
