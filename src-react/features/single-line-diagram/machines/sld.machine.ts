import { setup, assign, fromPromise } from 'xstate';
import { Effect } from 'effect';
import { ProjectClient } from '@/services/common/project-client';
import { LiveManagedRuntime } from '@/config/live-layer';
import { SldDiagram } from '@/types/sld-diagram';

export interface SldContext {
  lineId: string | null;
  diagramData: SldDiagram | null;
  error: string | null;
  cache: Map<string, SldDiagram>;
  runtime: LiveManagedRuntime | null;
  lastUpdate: Date | null;
  isAutoRefreshEnabled: boolean;
}

// Types pour les événements utilisateur
export type SldEvent =
  | { type: 'LOAD_DIAGRAM'; lineId: string }
  | { type: 'CLEAR_DIAGRAM' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RETRY' }
  | { type: 'SET_RUNTIME'; runtime: LiveManagedRuntime }
  | { type: 'ENABLE_AUTO_REFRESH' }
  | { type: 'DISABLE_AUTO_REFRESH' }
  | { type: 'AUTO_REFRESH_TICK' }
  | { type: 'MANUAL_REFRESH' };

// Actor pour charger le diagramme en utilisant Effect
const loadDiagramActor = fromPromise(
  async ({
    input,
  }: {
    input: { lineId: string; runtime: LiveManagedRuntime };
  }) => {
    const { lineId, runtime } = input;

    // Créer le programme Effect
    const program = Effect.gen(function* () {
      const projectClient = yield* ProjectClient;
      return yield* projectClient.getSingleLineDiagram(lineId);
    });

    return runtime.runPromise(program);
  },
);

// Configuration de la machine XState
export const sldMachine = setup({
  types: {
    context: {} as SldContext,
    events: {} as SldEvent,
  },
  actors: {
    loadDiagram: loadDiagramActor,
  },
  guards: {
    isDiagramCached: ({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return false;
      return context.cache.has(event.lineId);
    },
    isSameDiagram: ({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return false;
      return context.lineId === event.lineId;
    },
    hasRuntime: ({ context }) => {
      return context.runtime !== null;
    },
    hasCurrentLineId: ({ context }) => {
      return context.lineId !== null;
    },
    isAutoRefreshEnabled: ({ context }) => {
      return context.isAutoRefreshEnabled;
    },
  },
  actions: {
    setRuntime: assign(({ context, event }) => {
      if (event.type !== 'SET_RUNTIME') return context;
      return {
        ...context,
        runtime: event.runtime,
      };
    }),

    enableAutoRefresh: assign(({ context }) => ({
      ...context,
      isAutoRefreshEnabled: true,
    })),

    disableAutoRefresh: assign(({ context }) => ({
      ...context,
      isAutoRefreshEnabled: false,
    })),

    loadFromCache: assign(({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return context;

      const cachedData = context.cache.get(event.lineId);
      return {
        ...context,
        lineId: event.lineId,
        diagramData: cachedData || null,
        error: null,
      };
    }),

    setLineId: assign(({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return context;

      return {
        ...context,
        lineId: event.lineId,
        error: null,
      };
    }),

    updateLastUpdateTime: assign(({ context }) => ({
      ...context,
      lastUpdate: new Date(),
    })),

    clearDiagram: assign(({ context }) => ({
      ...context,
      lineId: null,
      diagramData: null,
      error: null,
      lastUpdate: null,
      isAutoRefreshEnabled: false,
    })),

    clearCache: assign(({ context }) => ({
      ...context,
      cache: new Map(),
    })),
  },
}).createMachine({
  id: 'sldDiagram',
  initial: 'idle',
  context: {
    lineId: null,
    diagramData: null,
    error: null,
    cache: new Map(),
    runtime: null,
    lastUpdate: null,
    isAutoRefreshEnabled: false,
  },
  states: {
    idle: {
      on: {
        SET_RUNTIME: {
          actions: 'setRuntime',
        },
        LOAD_DIAGRAM: [
          {
            guard: 'isSameDiagram',
            target: 'idle',
          },
          {
            guard: 'isDiagramCached',
            target: 'loaded',
            actions: 'loadFromCache',
          },
          {
            guard: 'hasRuntime',
            target: 'loading',
            actions: 'setLineId',
          },
          {
            target: 'waitingForRuntime',
            actions: 'setLineId',
          },
        ],
        CLEAR_CACHE: {
          actions: 'clearCache',
        },
      },
    },
    waitingForRuntime: {
      on: {
        SET_RUNTIME: {
          target: 'loading',
          actions: 'setRuntime',
        },
        LOAD_DIAGRAM: [
          {
            guard: 'isDiagramCached',
            target: 'loaded',
            actions: 'loadFromCache',
          },
          {
            target: 'waitingForRuntime',
            actions: 'setLineId',
          },
        ],
        CLEAR_DIAGRAM: {
          target: 'idle',
          actions: 'clearDiagram',
        },
      },
    },
    loading: {
      invoke: {
        id: 'loadDiagram',
        src: 'loadDiagram',
        input: ({ context }) => ({
          lineId: context.lineId!,
          runtime: context.runtime!,
        }),
        onDone: {
          target: 'loaded',
          actions: [
            assign(({ context, event }) => {
              const diagramData = event.output;
              const newCache = new Map(context.cache);

              if (context.lineId) {
                newCache.set(context.lineId, diagramData);
              }

              return {
                ...context,
                diagramData,
                cache: newCache,
                error: null,
              };
            }),
            'updateLastUpdateTime',
          ],
        },
        onError: {
          target: 'error',
          actions: assign(({ context, event }) => ({
            ...context,
            diagramData: null,
            error: String(event.error) || 'Erreur inconnue',
          })),
        },
      },
    },
    loaded: {
      // Auto-refresh timer de 5 secondes
      after: {
        5000: [
          {
            guard: 'isAutoRefreshEnabled',
            target: 'refreshing',
          },
        ],
      },
      on: {
        SET_RUNTIME: {
          actions: 'setRuntime',
        },
        ENABLE_AUTO_REFRESH: {
          actions: 'enableAutoRefresh',
        },
        DISABLE_AUTO_REFRESH: {
          actions: 'disableAutoRefresh',
        },
        MANUAL_REFRESH: [
          {
            guard: 'hasRuntime',
            target: 'refreshing',
          },
          {
            target: 'waitingForRuntime',
          },
        ],
        LOAD_DIAGRAM: [
          {
            guard: 'isSameDiagram',
            target: 'loaded',
          },
          {
            guard: 'isDiagramCached',
            target: 'loaded',
            actions: 'loadFromCache',
          },
          {
            guard: 'hasRuntime',
            target: 'loading',
            actions: ['setLineId', 'disableAutoRefresh'],
          },
          {
            target: 'waitingForRuntime',
            actions: ['setLineId', 'disableAutoRefresh'],
          },
        ],
        CLEAR_DIAGRAM: {
          target: 'idle',
          actions: 'clearDiagram',
        },
        CLEAR_CACHE: {
          actions: 'clearCache',
        },
      },
    },
    refreshing: {
      invoke: {
        id: 'refreshDiagram',
        src: 'loadDiagram',
        input: ({ context }) => ({
          lineId: context.lineId!,
          runtime: context.runtime!,
        }),
        onDone: {
          target: 'loaded',
          actions: [
            assign(({ context, event }) => {
              const diagramData = event.output;
              const newCache = new Map(context.cache);

              if (context.lineId) {
                newCache.set(context.lineId, diagramData);
              }

              return {
                ...context,
                diagramData,
                cache: newCache,
                error: null,
              };
            }),
            'updateLastUpdateTime',
          ],
        },
        onError: {
          target: 'loaded', // Retourne à loaded même en cas d'erreur de refresh
          actions: assign(({ context, event }) => ({
            ...context,
            error: `Erreur de refresh: ${String(event.error) || 'Erreur inconnue'}`,
          })),
        },
      },
    },
    error: {
      on: {
        SET_RUNTIME: {
          actions: 'setRuntime',
        },
        RETRY: [
          {
            guard: 'hasRuntime',
            target: 'loading',
          },
          {
            target: 'waitingForRuntime',
          },
        ],
        LOAD_DIAGRAM: [
          {
            guard: 'isDiagramCached',
            target: 'loaded',
            actions: 'loadFromCache',
          },
          {
            guard: 'hasRuntime',
            target: 'loading',
            actions: 'setLineId',
          },
          {
            target: 'waitingForRuntime',
            actions: 'setLineId',
          },
        ],
        CLEAR_DIAGRAM: {
          target: 'idle',
          actions: 'clearDiagram',
        },
        CLEAR_CACHE: {
          actions: 'clearCache',
        },
      },
    },
  },
});