import { useActor } from '@xstate/react';
import { sldMachine } from '../machines/sld.machine';
import { StoreRuntime, useStoreRuntime } from '@/hooks/use-store-runtime';
import { LiveManagedRuntime } from '@/config/live-layer';
import { SldDiagram } from '@/types/sld-diagram';

interface SldStore extends StoreRuntime {
  // État actuel
  state:
    | 'error'
    | 'idle'
    | 'loaded'
    | 'loading'
    | 'waitingForRuntime'
    | 'refreshing';
  context: any;

  // États calculés
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  isIdle: boolean;
  isWaitingForRuntime: boolean;
  isRefreshing: boolean;

  // Données
  diagramData: SldDiagram | null;
  error: string | null;
  lineId: string | null;
  cacheSize: number;
  lastUpdate: Date | null;
  isAutoRefreshEnabled: boolean;

  // Actions
  loadDiagram: (lineId: string) => void;
  clearDiagram: () => void;
  clearCache: () => void;
  retry: () => void;

  // Actions de refresh
  enableAutoRefresh: () => void;
  disableAutoRefresh: () => void;
  manualRefresh: () => void;

  // Helpers
  isInCache: (lineId: string) => boolean;
  getCachedIds: () => string[];
  getTimeSinceLastUpdate: () => number | null; // en millisecondes
  getFormattedLastUpdate: () => string | null;

  // Runtime (hérité de StoreRuntime mais redéfini pour clarté)
  runtime: LiveManagedRuntime | null;
  setRuntime: (runtime: LiveManagedRuntime) => void;
}

// Hook React pour utiliser le store avec useActor (recommandé pour XState v5)
const useSldStoreInner = (): SldStore => {
  const [state, send] = useActor(sldMachine);

  const getTimeSinceLastUpdate = (): number | null => {
    if (!state.context.lastUpdate) return null;
    return Date.now() - state.context.lastUpdate.getTime();
  };

  const getFormattedLastUpdate = (): string | null => {
    if (!state.context.lastUpdate) return null;
    return state.context.lastUpdate.toLocaleString();
  };

  return {
    // État actuel
    state: state.value as
      | 'error'
      | 'idle'
      | 'loaded'
      | 'loading'
      | 'waitingForRuntime'
      | 'refreshing',
    context: state.context,

    // États calculés
    isLoading: state.matches('loading'),
    isLoaded: state.matches('loaded'),
    isError: state.matches('error'),
    isIdle: state.matches('idle'),
    isWaitingForRuntime: state.matches('waitingForRuntime'),
    isRefreshing: state.matches('refreshing'),

    // Données
    diagramData: state.context.diagramData,
    error: state.context.error,
    lineId: state.context.lineId,
    cacheSize: state.context.cache.size,
    lastUpdate: state.context.lastUpdate,
    isAutoRefreshEnabled: state.context.isAutoRefreshEnabled,

    // Actions
    loadDiagram: (lineId: string) => send({ type: 'LOAD_DIAGRAM', lineId }),
    clearDiagram: () => send({ type: 'CLEAR_DIAGRAM' }),
    clearCache: () => send({ type: 'CLEAR_CACHE' }),
    retry: () => send({ type: 'RETRY' }),

    // Actions de refresh
    enableAutoRefresh: () => send({ type: 'ENABLE_AUTO_REFRESH' }),
    disableAutoRefresh: () => send({ type: 'DISABLE_AUTO_REFRESH' }),
    manualRefresh: () => send({ type: 'MANUAL_REFRESH' }),

    // Helpers
    isInCache: (lineId: string) => state.context.cache.has(lineId),
    getCachedIds: () => Array.from(state.context.cache.keys()),
    getTimeSinceLastUpdate,
    getFormattedLastUpdate,

    // Runtime
    runtime: state.context.runtime,
    setRuntime: (runtime: LiveManagedRuntime) =>
      send({ type: 'SET_RUNTIME', runtime }),
  };
};

export const useSldStore = () => useStoreRuntime<SldStore>(useSldStoreInner);
