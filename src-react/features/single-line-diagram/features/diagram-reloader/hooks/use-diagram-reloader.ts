import { useActor } from '@xstate/react';
import { useRef, useEffect } from 'react';
import { LiveManagedRuntime } from '@/config/live-layer';
import { reloaderMachine } from '../machines/reloader.machine';
import { DiagramReloaderStore } from '../types/diagram-reloader.type';
import { useStoreRuntime } from '@/hooks/use-store-runtime';

interface UseDiagramReloaderOptions {
  id?: string;
  autoLoad?: boolean;
}

const useDiagramReloaderInner = (options: UseDiagramReloaderOptions = {}) => {
  const { id, autoLoad = false } = options;
  const [state, send] = useActor(reloaderMachine);

  // Refs pour la gestion de l'ID
  const previousIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const getTimeSinceLastUpdate = (): number | null => {
    if (!state.context.lastUpdate) return null;
    return Date.now() - state.context.lastUpdate.getTime();
  };

  const getFormattedLastUpdate = (): string | null => {
    if (!state.context.lastUpdate) return null;
    return state.context.lastUpdate.toLocaleString();
  };

  // Actions de base
  const loadDiagram = (lineId: string) =>
    send({ type: 'LOAD_DIAGRAM', lineId });
  const clearDiagram = () => send({ type: 'CLEAR_DIAGRAM' });

  // Gestion de l'initialisation et du changement d'ID
  useEffect(() => {
    if (!autoLoad || !id) return;

    const isIdChanged = previousIdRef.current !== id;
    const isReady = state.context.runtime !== null; // ou votre condition pour isReady
    const shouldLoad = isReady && (isIdChanged || !hasInitializedRef.current);

    if (shouldLoad) {
      // Nettoyer le diagramme précédent si l'ID a changé
      if (isIdChanged && previousIdRef.current !== null) {
        clearDiagram();
      }

      // Charger le nouveau diagramme
      loadDiagram(id);

      // Marquer comme initialisé et sauvegarder l'ID actuel
      hasInitializedRef.current = true;
      previousIdRef.current = id;
    }
  }, [id, state.context.runtime, autoLoad]);

  // Réinitialiser les refs si l'ID change
  useEffect(() => {
    if (!autoLoad) return;

    if (previousIdRef.current !== null && previousIdRef.current !== id) {
      hasInitializedRef.current = false;
    }
  }, [id, autoLoad]);

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
    isReady: state.context.runtime !== null, // ou votre logique pour isReady

    // Data
    diagramData: state.context.diagramData,
    error: state.context.error,
    lineId: state.context.lineId,
    cacheSize: state.context.cache.size,
    lastUpdate: state.context.lastUpdate,
    isAutoRefreshEnabled: state.context.isAutoRefreshEnabled,
    currentId: id,

    // Load Actions
    loadDiagram,
    clearDiagram,
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

export const useDiagramReloader = (options?: UseDiagramReloaderOptions) =>
  useStoreRuntime<DiagramReloaderStore>(() => useDiagramReloaderInner(options));
