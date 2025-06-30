import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { SldStore } from '../types';
import { LiveManagedRuntime } from '@/config/live-layer';
import { useActor } from '@xstate/react';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { loaderMachine } from '../machines/loader.machine';

const SldContext = createContext<
  | (Omit<SldStore, 'runtime' | 'setRuntime'> & {
      isReady: boolean;
      currentId: string;
    })
  | null
>(null);

export const useSldContext = () => {
  const context = useContext(SldContext);
  if (!context) {
    throw new Error('useSldContext must be used within SldProvider');
  }
  return context;
};

interface SldProviderProps {
  children: ReactNode;
  id: string;
}

export const SldProvider: React.FC<SldProviderProps> = ({ children, id }) => {
  const previousIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

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

  const store = useStoreRuntime<SldStore>(useSldStoreInner);

  // Gestion de l'initialisation et du changement d'ID
  useEffect(() => {
    const isIdChanged = previousIdRef.current !== id;
    const isReady = store.isReady;
    const shouldLoad =
      id && isReady && (isIdChanged || !hasInitializedRef.current);

    if (shouldLoad) {
      // Nettoyer le diagramme précédent si l'ID a changé
      if (isIdChanged && previousIdRef.current !== null) {
        store.clearDiagram();
      }

      // Charger le nouveau diagramme
      store.loadDiagram(id);

      // Marquer comme initialisé et sauvegarder l'ID actuel
      hasInitializedRef.current = true;
      previousIdRef.current = id;
    }
  }, [id, store.isReady, store.loadDiagram, store.clearDiagram]);

  // Réinitialiser les refs si l'ID change
  useEffect(() => {
    if (previousIdRef.current !== null && previousIdRef.current !== id) {
      hasInitializedRef.current = false;
    }
  }, [id]);

  // Ajouter l'ID actuel au store pour que les composants enfants puissent y accéder
  const enhancedStore = {
    ...store,
    currentId: id,
  };

  return (
    <SldContext.Provider value={enhancedStore}>{children}</SldContext.Provider>
  );
};
