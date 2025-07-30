import { Channel } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';
import { toast } from 'sonner';
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { LiveManagedRuntime } from '@/config/live-layer';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import {
  FeederClient,
  FeederActionResponse,
  FeederStatus,
  FeederOperationError,
} from '@/services/common/feeder-client';

interface FeederStore {
  runtime: LiveManagedRuntime | null;
  feeders: Map<string, FeederStatus>;
  isAddingFeeder: boolean;
  error: FeederOperationError | null;
  channels: Map<string, Channel<any>>;

  setRuntime: (runtime: LiveManagedRuntime) => void;
  addNatsFeeder: (
    feederId: string,
    onMessage?: (message: any) => void,
  ) => Promise<void>;
  removeFeeder: (feederId: string) => void;
  getFeederStatus: (feederId: string) => FeederStatus | null;
  getAllFeeders: () => FeederStatus[];
  clearError: () => void;
  cleanup: () => void;
}

export const useFeederStore = () =>
  useStoreRuntime<FeederStore>(useFeederStoreInner);

const createFeederStore: StateCreator<
  FeederStore,
  [['zustand/devtools', never], ['zustand/subscribeWithSelector', never]]
> = (set, get) => ({
  runtime: null,
  feeders: new Map(),
  isAddingFeeder: false,
  error: null,
  channels: new Map(),

  setRuntime: (runtime) => {
    set({ runtime });
  },

  addNatsFeeder: async (
    feederId: string,
    onMessage?: (message: any) => void,
  ) => {
    const { runtime, feeders, channels } = get();
    if (!runtime) {
      set({
        error: new FeederOperationError(
          'AddNats',
          feederId,
          'Runtime not available',
        ),
      });
      return;
    }

    // Vérifier si le feeder existe déjà
    if (feeders.has(feederId)) {
      set({
        error: new FeederOperationError(
          'AddNats',
          feederId,
          'Feeder already exists',
        ),
      });
      return;
    }

    set({ isAddingFeeder: true, error: null });

    try {
      // Créer un channel pour ce feeder
      const channel = new Channel<any>();

      // Configurer le listener de messages
      if (onMessage) {
        channel.onmessage = (message) => {
          console.log(`Message reçu du feeder '${feederId}':`, message);
          onMessage(message);
        };
      } else {
        // Listener par défaut qui log les messages
        channel.onmessage = (message) => {
          console.log(`Message reçu du feeder '${feederId}':`, message);
        };
      }

      const addFeederEffect = Effect.gen(function* () {
        const feederClient = yield* FeederClient;
        return yield* feederClient.addNatsFeeder(feederId, channel);
      });

      const result: FeederActionResponse =
        await runtime.runPromise(addFeederEffect);

      if (result.success && result.feeder_status) {
        // Mettre à jour le state avec le nouveau feeder
        const newFeeders = new Map(feeders);
        const newChannels = new Map(channels);

        newFeeders.set(feederId, result.feeder_status);
        newChannels.set(feederId, channel);

        set({
          isAddingFeeder: false,
          feeders: newFeeders,
          channels: newChannels,
        });

        console.log(`Feeder '${feederId}' ajouté avec succès:`, result.message);
      } else {
        throw new Error(result.message || 'Failed to add feeder');
      }
    } catch (error) {
      set({
        isAddingFeeder: false,
        error: error as FeederOperationError,
      });
      console.error(`Erreur lors de l'ajout du feeder '${feederId}':`, error);
    }
  },

  removeFeeder: (feederId: string) => {
    const { feeders, channels } = get();

    // Nettoyer le channel
    const channel = channels.get(feederId);
    if (channel) {
      // Fermer le channel si possible
      try {
        // channel.onmessage = null;
      } catch (error) {
        console.warn(
          `Erreur lors de la fermeture du channel pour '${feederId}':`,
          error,
        );
      }
    }

    // Supprimer du state
    const newFeeders = new Map(feeders);
    const newChannels = new Map(channels);

    newFeeders.delete(feederId);
    newChannels.delete(feederId);

    set({
      feeders: newFeeders,
      channels: newChannels,
    });

    console.log(`Feeder '${feederId}' supprimé`);
  },

  getFeederStatus: (feederId: string) => {
    const { feeders } = get();
    return feeders.get(feederId) || null;
  },

  getAllFeeders: () => {
    const { feeders } = get();
    return Array.from(feeders.values());
  },

  clearError: () => {
    set({ error: null });
  },

  cleanup: () => {
    const { channels } = get();

    // Nettoyer tous les channels
    channels.forEach((_channel, feederId) => {
      try {
        // channel.onmessage = null;
      } catch (error) {
        console.warn(
          `Erreur lors du nettoyage du channel pour '${feederId}':`,
          error,
        );
      }
    });

    set({
      feeders: new Map(),
      channels: new Map(),
      error: null,
    });
  },
});

const useFeederStoreInner = create<FeederStore>()(
  devtools(subscribeWithSelector(createFeederStore), { name: 'feeder-store' }),
);

useFeederStoreInner.subscribe(
  (state) => state.error,
  (error) => {
    if (error) {
      toast(error.message);
    }
  },
  {
    fireImmediately: false,
  },
);

// Nettoyage automatique lors du démontage
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const { cleanup } = useFeederStoreInner.getState();
    cleanup();
  });
}
