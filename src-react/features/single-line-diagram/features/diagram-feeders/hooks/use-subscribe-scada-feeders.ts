// useSubscribeScadaFeeders.ts
import { useActor } from '@xstate/react';
import { useRef, useEffect } from 'react';
import { LiveManagedRuntime } from '@/config/live-layer';
import { scadaFeedersMachine } from '../machines/subscribe-scada.machine';
import { SldMetadata } from '@/types/sld-metadata';
import { useStoreRuntime } from '@/hooks/use-store-runtime';

interface UseSubscribeScadaFeedersOptions {
  metadata?: SldMetadata;
  autoSubscribe?: boolean;
}

export interface ScadaFeedersStore {
  // State
  state: 'error' | 'idle' | 'subscribed' | 'subscribing' | 'waitingForRuntime';
  context: typeof scadaFeedersMachine.initialState.context;

  // Computed States
  isSubscribing: boolean;
  isSubscribed: boolean;
  isError: boolean;
  isIdle: boolean;
  isWaitingForRuntime: boolean;
  isReady: boolean;

  // Data
  metadata: SldMetadata | null;
  error: string | null;
  lastSubscription: Date | null;
  currentMetadata?: SldMetadata;

  // Actions
  subscribe: (metadata: SldMetadata) => void;
  unsubscribe: () => void;
  retry: () => void;
  clearError: () => void;

  // Helpers
  getTimeSinceLastSubscription: () => number | null;
  getFormattedLastSubscription: () => string | null;

  // Runtime
  runtime: LiveManagedRuntime | null;
  setRuntime: (runtime: LiveManagedRuntime) => void;
}

const useSubscribeScadaFeedersInner = (
  options: UseSubscribeScadaFeedersOptions = {},
): ScadaFeedersStore => {
  const { metadata, autoSubscribe = false } = options;
  const [state, send] = useActor(scadaFeedersMachine);

  // Refs pour la gestion des métadonnées
  const previousMetadataRef = useRef<SldMetadata | null>(null);
  const hasInitializedRef = useRef(false);

  const getTimeSinceLastSubscription = (): number | null => {
    if (!state.context.lastSubscription) return null;
    return Date.now() - state.context.lastSubscription.getTime();
  };

  const getFormattedLastSubscription = (): string | null => {
    if (!state.context.lastSubscription) return null;
    return state.context.lastSubscription.toLocaleString();
  };

  // Actions de base
  const subscribe = (metadata: SldMetadata) =>
    send({ type: 'SUBSCRIBE', metadata });
  const unsubscribe = () => send({ type: 'UNSUBSCRIBE' });

  // Gestion de l'auto-subscription
  useEffect(() => {
    if (!autoSubscribe || !metadata) return;

    const isMetadataChanged =
      JSON.stringify(previousMetadataRef.current) !== JSON.stringify(metadata);
    const isReady = state.context.runtime !== null;
    const shouldSubscribe = isReady && (isMetadataChanged || !hasInitializedRef.current);

    if (shouldSubscribe) {
      // Souscrire avec les nouvelles métadonnées
      subscribe(metadata);

      // Marquer comme initialisé et sauvegarder les métadonnées actuelles
      hasInitializedRef.current = true;
      previousMetadataRef.current = metadata;
    }
  }, [metadata, state.context.runtime, autoSubscribe]);

  // Réinitialiser les refs si les métadonnées changent
  useEffect(() => {
    if (!autoSubscribe) return;

    if (previousMetadataRef.current !== null &&
      JSON.stringify(previousMetadataRef.current) !== JSON.stringify(metadata)) {
      hasInitializedRef.current = false;
    }
  }, [metadata, autoSubscribe]);

  return {
    // State
    state: state.value as
      | 'error'
      | 'idle'
      | 'subscribed'
      | 'subscribing'
      | 'waitingForRuntime',
    context: state.context,

    // Computed States
    isSubscribing: state.matches('subscribing'),
    isSubscribed: state.matches('subscribed'),
    isError: state.matches('error'),
    isIdle: state.matches('idle'),
    isWaitingForRuntime: state.matches('waitingForRuntime'),
    isReady: state.context.runtime !== null,

    // Data
    metadata: state.context.metadata,
    error: state.context.error,
    lastSubscription: state.context.lastSubscription,
    currentMetadata: metadata,

    // Actions
    subscribe,
    unsubscribe,
    retry: () => send({ type: 'RETRY' }),
    clearError: () => send({ type: 'CLEAR_ERROR' }),

    // Helpers
    getTimeSinceLastSubscription,
    getFormattedLastSubscription,

    // Runtime
    runtime: state.context.runtime,
    setRuntime: (runtime: LiveManagedRuntime) =>
      send({ type: 'SET_RUNTIME', runtime }),
  };
};

export const useSubscribeScadaFeeders = (
  options?: UseSubscribeScadaFeedersOptions
) =>
  useStoreRuntime<ScadaFeedersStore>(() =>
    useSubscribeScadaFeedersInner(options)
  );
