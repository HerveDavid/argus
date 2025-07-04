import * as Effect from 'effect/Effect';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { NatsClient } from '@/services/common/nats-client';
import { LiveManagedRuntime } from '@/config/live-layer';
import {
  NatsConnectionStatus,
  NatsError,
  NatsConnectionResponse,
  NatsAddressResponse,
} from '@/services/common/nats-client';

interface NatsStore {
  runtime: LiveManagedRuntime | null;
  status: NatsConnectionStatus | null;
  address: string | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isSettingAddress: boolean;
  isLoadingStatus: boolean;
  isLoadingSavedAddress: boolean;
  error: NatsError | null;

  // Nouvelles propriétés pour le backoff
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isReconnecting: boolean;
  reconnectTimeoutId: NodeJS.Timeout | null;

  setRuntime: (runtime: LiveManagedRuntime) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setAddress: (address: string) => Promise<void>;
  getStatus: () => Promise<void>;
  loadSavedAddress: () => Promise<void>;
  connectToSavedAddress: () => Promise<void>;
  clearError: () => void;

  // Nouvelles méthodes
  stopReconnection: () => void;
  resetReconnectAttempts: () => void;
}

// Configuration du backoff exponentiel
const BACKOFF_CONFIG = {
  initialDelay: 1000, // 1 seconde
  maxDelay: 60000, // 1 minute
  multiplier: 2,
  jitter: 0.1, // 10% de variation aléatoire
  maxAttempts: 10,
};

// Fonction pour calculer le délai avec backoff exponentiel
const calculateBackoffDelay = (attempt: number): number => {
  const baseDelay = Math.min(
    BACKOFF_CONFIG.initialDelay * Math.pow(BACKOFF_CONFIG.multiplier, attempt),
    BACKOFF_CONFIG.maxDelay,
  );

  // Ajouter du jitter pour éviter les reconnexions simultanées
  const jitter = baseDelay * BACKOFF_CONFIG.jitter * (Math.random() - 0.5);
  return Math.max(baseDelay + jitter, BACKOFF_CONFIG.initialDelay);
};

export const useNatsStore = () => useStoreRuntime<NatsStore>(useNatsStoreInner);

const useNatsStoreInner = create<NatsStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      runtime: null,
      status: null,
      address: null,
      isConnecting: false,
      isDisconnecting: false,
      isSettingAddress: false,
      isLoadingStatus: false,
      isLoadingSavedAddress: false,
      error: null,

      // Nouvelles propriétés
      reconnectAttempts: 0,
      maxReconnectAttempts: BACKOFF_CONFIG.maxAttempts,
      isReconnecting: false,
      reconnectTimeoutId: null,

      setRuntime: (runtime) => {
        set({ runtime });

        // Charger l'adresse sauvegardée et le statut initial
        const { loadSavedAddress, getStatus } = get();
        Promise.all([loadSavedAddress(), getStatus()]);
      },

      connect: async () => {
        const { runtime } = get();
        if (!runtime) return;

        set({ isConnecting: true, error: null });

        try {
          const connectEffect = Effect.gen(function* () {
            const natsClient = yield* NatsClient;
            return yield* natsClient.connect();
          });

          const result: NatsConnectionResponse =
            await runtime.runPromise(connectEffect);

          set({
            isConnecting: false,
            address: result.address,
          });

          // Réinitialiser les tentatives de reconnexion en cas de succès
          get().resetReconnectAttempts();

          // Rafraîchir le statut après connexion
          await get().getStatus();
        } catch (error) {
          set({
            isConnecting: false,
            error: error as NatsError,
          });
        }
      },

      disconnect: async () => {
        const { runtime, stopReconnection } = get();
        if (!runtime) return;

        // Arrêter toute tentative de reconnexion en cours
        stopReconnection();

        set({ isDisconnecting: true, error: null });

        try {
          const disconnectEffect = Effect.gen(function* () {
            const natsClient = yield* NatsClient;
            return yield* natsClient.disconnect();
          });

          await runtime.runPromise(disconnectEffect);

          set({
            isDisconnecting: false,
            status: null,
            address: null,
          });
        } catch (error) {
          set({
            isDisconnecting: false,
            error: error as NatsError,
          });
        }
      },

      setAddress: async (address: string) => {
        const { runtime } = get();
        if (!runtime) return;

        set({ isSettingAddress: true, error: null });

        try {
          const setAddressEffect = Effect.gen(function* () {
            const natsClient = yield* NatsClient;
            return yield* natsClient.setAddress(address);
          });

          const result: NatsAddressResponse =
            await runtime.runPromise(setAddressEffect);

          set({
            isSettingAddress: false,
            address: result.address,
          });
        } catch (error) {
          set({
            isSettingAddress: false,
            error: error as NatsError,
          });
        }
      },

      getStatus: async () => {
        const { runtime } = get();
        if (!runtime) return;

        set({ isLoadingStatus: true, error: null });

        try {
          const statusEffect = Effect.gen(function* () {
            const natsClient = yield* NatsClient;
            return yield* natsClient.getConnectionStatus();
          });

          const status: NatsConnectionStatus =
            await runtime.runPromise(statusEffect);

          set({
            isLoadingStatus: false,
            status,
            address: status.address,
          });
        } catch (error) {
          set({
            isLoadingStatus: false,
            error: error as NatsError,
          });
        }
      },

      loadSavedAddress: async () => {
        const { runtime } = get();
        if (!runtime) return;

        set({ isLoadingSavedAddress: true, error: null });

        try {
          const getSavedAddressEffect = Effect.gen(function* () {
            const natsClient = yield* NatsClient;
            return yield* natsClient.getSavedAddress();
          });

          const savedAddress: string | null = await runtime.runPromise(
            getSavedAddressEffect,
          );

          set({
            isLoadingSavedAddress: false,
            address: savedAddress,
          });
        } catch (error) {
          set({
            isLoadingSavedAddress: false,
            error: error as NatsError,
          });
        }
      },

      connectToSavedAddress: async () => {
        const { runtime } = get();
        if (!runtime) return;

        set({ isConnecting: true, error: null });

        try {
          const connectToSavedEffect = Effect.gen(function* () {
            const natsClient = yield* NatsClient;
            return yield* natsClient.connectToSavedAddress();
          });

          const result: NatsConnectionResponse =
            await runtime.runPromise(connectToSavedEffect);

          set({
            isConnecting: false,
            address: result.address,
          });

          // Réinitialiser les tentatives de reconnexion en cas de succès
          get().resetReconnectAttempts();

          // Rafraîchir le statut après connexion
          await get().getStatus();
        } catch (error) {
          set({
            isConnecting: false,
            error: error as NatsError,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      stopReconnection: () => {
        const { reconnectTimeoutId } = get();
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
          set({
            reconnectTimeoutId: null,
            isReconnecting: false,
          });
        }
      },

      resetReconnectAttempts: () => {
        const { stopReconnection } = get();
        stopReconnection();
        set({ reconnectAttempts: 0 });
      },
    })),
    { name: 'nats-store' },
  ),
);

// Auto-refresh du statut toutes les 30 secondes si connecté
useNatsStoreInner.subscribe(
  (state) => state.status?.connected,
  (isConnected) => {
    if (isConnected) {
      const interval = setInterval(() => {
        const { getStatus } = useNatsStoreInner.getState();
        getStatus();
      }, 30000);

      return () => clearInterval(interval);
    }
  },
  {
    fireImmediately: false,
  },
);

// Gestion des erreurs automatique - log des erreurs
useNatsStoreInner.subscribe(
  (state) => state.error,
  (error) => {
    if (error) {
      console.error('NATS Error:', error.message);

      // Optionnel: notifier l'utilisateur via un toast/notification
      // toast.error(error.message);
    }
  },
  {
    fireImmediately: false,
  },
);

// Auto-reconnexion avec backoff exponentiel
useNatsStoreInner.subscribe(
  (state) => ({
    connected: state.status?.connected,
    hasAddress: !!state.address,
    isConnecting: state.isConnecting,
    isDisconnecting: state.isDisconnecting,
    isReconnecting: state.isReconnecting,
    reconnectAttempts: state.reconnectAttempts,
    maxReconnectAttempts: state.maxReconnectAttempts,
  }),
  ({
    connected,
    hasAddress,
    isConnecting,
    isDisconnecting,
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
  }) => {
    // Si on a une adresse mais qu'on n'est pas connecté et pas en train de se connecter/déconnecter
    if (
      hasAddress &&
      connected === false &&
      !isConnecting &&
      !isDisconnecting &&
      !isReconnecting &&
      reconnectAttempts < maxReconnectAttempts
    ) {
      console.log(
        `Tentative de reconnexion automatique (${reconnectAttempts + 1}/${maxReconnectAttempts})...`,
      );

      const delay = calculateBackoffDelay(reconnectAttempts);
      console.log(`Prochaine tentative dans ${Math.round(delay / 1000)}s`);

      const { connectToSavedAddress } = useNatsStoreInner.getState();

      // Marquer comme en cours de reconnexion
      useNatsStoreInner.setState({ isReconnecting: true });

      const timeoutId = setTimeout(async () => {
        try {
          // Incrémenter le nombre de tentatives
          const currentState = useNatsStoreInner.getState();
          useNatsStoreInner.setState({
            reconnectAttempts: currentState.reconnectAttempts + 1,
            isReconnecting: false,
            reconnectTimeoutId: null,
          });

          await connectToSavedAddress();
        } catch (error) {
          console.error('Erreur lors de la reconnexion automatique:', error);
          useNatsStoreInner.setState({ isReconnecting: false });
        }
      }, delay);

      // Stocker l'ID du timeout pour pouvoir l'annuler si nécessaire
      useNatsStoreInner.setState({ reconnectTimeoutId: timeoutId });
    }

    // Si on a atteint le nombre maximum de tentatives
    if (reconnectAttempts >= maxReconnectAttempts && !connected) {
      console.error('Nombre maximum de tentatives de reconnexion atteint');
      // Optionnel: notifier l'utilisateur qu'il faut une intervention manuelle
      // toast.error('Connexion impossible. Veuillez vérifier votre configuration.');
    }
  },
  {
    fireImmediately: false,
    equalityFn: (a, b) =>
      a.connected === b.connected &&
      a.hasAddress === b.hasAddress &&
      a.isConnecting === b.isConnecting &&
      a.isDisconnecting === b.isDisconnecting &&
      a.isReconnecting === b.isReconnecting &&
      a.reconnectAttempts === b.reconnectAttempts &&
      a.maxReconnectAttempts === b.maxReconnectAttempts,
  },
);

// Réinitialiser les tentatives de reconnexion quand on se connecte avec succès
useNatsStoreInner.subscribe(
  (state) => state.status?.connected,
  (isConnected) => {
    if (isConnected) {
      const { resetReconnectAttempts } = useNatsStoreInner.getState();
      resetReconnectAttempts();
    }
  },
  {
    fireImmediately: false,
  },
);
