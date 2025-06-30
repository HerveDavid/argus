import { useActor } from '@xstate/react';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { LiveManagedRuntime } from '@/config/live-layer';

import { SldStore } from '../types';
import { loaderMachine } from '../machines/loader.machine';

const useSldStoreInner = (): SldStore => {
  const [state, send] = useActor(loaderMachine);

  const getTimeSinceLastUpdate = (): number | null => {
    if (!state.context.lastUpdate) return null;
    return Date.now() - state.context.lastUpdate.getTime();
  };

  const getFormattedLastUpdate = (): string | null => {
    if (!state.context.lastUpdate) return null;
    return state.context.lastUpdate.toLocaleString();
  };

  return {
    // State
    state: state.value as
      | 'error'
      | 'idle'
      | 'loaded'
      | 'loading'
      | 'waitingForRuntime'
      | 'refreshing',
    context: state.context,

    // Computed States
    isLoading: state.matches('loading'),
    isLoaded: state.matches('loaded'),
    isError: state.matches('error'),
    isIdle: state.matches('idle'),
    isWaitingForRuntime: state.matches('waitingForRuntime'),
    isRefreshing: state.matches('refreshing'),

    // Data
    diagramData: state.context.diagramData,
    error: state.context.error,
    lineId: state.context.lineId,
    cacheSize: state.context.cache.size,
    lastUpdate: state.context.lastUpdate,
    isAutoRefreshEnabled: state.context.isAutoRefreshEnabled,

    // Load Actions
    loadDiagram: (lineId: string) => send({ type: 'LOAD_DIAGRAM', lineId }),
    clearDiagram: () => send({ type: 'CLEAR_DIAGRAM' }),
    clearCache: () => send({ type: 'CLEAR_CACHE' }),
    retry: () => send({ type: 'RETRY' }),

    // Refresh Actions
    enableAutoRefresh: () => send({ type: 'ENABLE_AUTO_REFRESH' }),
    disableAutoRefresh: () => send({ type: 'DISABLE_AUTO_REFRESH' }),
    manualRefresh: () => send({ type: 'MANUAL_REFRESH' }),

    // Helpers
    isInCache: (lineId: string) => state.context.cache.has(lineId),
    getCachedIds: () => Array.from(state.context.cache.keys()),
    getTimeSinceLastUpdate,
    getFormattedLastUpdate,

    // Effect Runtime
    runtime: state.context.runtime,
    setRuntime: (runtime: LiveManagedRuntime) =>
      send({ type: 'SET_RUNTIME', runtime }),
  };
};

export const useSldStore = () => useStoreRuntime<SldStore>(useSldStoreInner);
