import { useActor } from '@xstate/react';

import { sldMachine } from '../machines/sld.machine';

// Hook React pour utiliser le store avec useActor (recommandé pour XState v5)
export const useSldStore = () => {
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
  };
};
