import { useActor } from '@xstate/react';

import { sldMachine } from '../machines/sld.machine';
import { StoreRuntime, useStoreRuntime } from '@/hooks/use-store-runtime';
import { LiveManagedRuntime } from '@/config/live-layer';
import { SldDiagram } from '@/types/sld-diagram';

interface SldStore extends StoreRuntime {
  // État actuel
  state: "error" | "idle" | "loaded" | "loading" | "waitingForRuntime";
  context: any;
  
  // États calculés
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  isIdle: boolean;
  isWaitingForRuntime?: boolean;
  
  // Données
  diagramData: SldDiagram | null;
  error: string | null;
  lineId: string | null;
  cacheSize: number;
  
  // Actions
  loadDiagram: (lineId: string) => void;
  clearDiagram: () => void;
  clearCache: () => void;
  retry: () => void;
  
  // Helpers
  isInCache: (lineId: string) => boolean;
  getCachedIds: () => string[];
  
  // Runtime (hérité de StoreRuntime mais redéfini pour clarté)
  runtime: LiveManagedRuntime | null;
  setRuntime: (runtime: LiveManagedRuntime) => void;
}


// Hook React pour utiliser le store avec useActor (recommandé pour XState v5)
const useSldStoreInner = (): SldStore => {
  const [state, send] = useActor(sldMachine);

  return {
    // État actuel
    state: state.value,
    context: state.context,
    // États calculés
    isLoading: state.matches('loading'),
    isLoaded: state.matches('loaded'),
    isError: state.matches('error'),
    isIdle: state.matches('idle'),
    // Données
    diagramData: state.context.diagramData,
    error: state.context.error,
    lineId: state.context.lineId,
    cacheSize: state.context.cache.size,
    // Actions
    loadDiagram: (lineId: string) => send({ type: 'LOAD_DIAGRAM', lineId }),
    clearDiagram: () => send({ type: 'CLEAR_DIAGRAM' }),
    clearCache: () => send({ type: 'CLEAR_CACHE' }),
    retry: () => send({ type: 'RETRY' }),
    // Helpers
    isInCache: (lineId: string) => state.context.cache.has(lineId),
    getCachedIds: () => Array.from(state.context.cache.keys()),
    // Runtime
    runtime: state.context.runtime,
    setRuntime: (runtime: LiveManagedRuntime) => send({ type: 'SET_RUNTIME', runtime }),
  };
};

export const useSldStore = () => useStoreRuntime<SldStore>(useSldStoreInner)