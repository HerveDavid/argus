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
}

// Types pour les événements utilisateur
export type SldEvent =
  | { type: 'LOAD_DIAGRAM'; lineId: string }
  | { type: 'CLEAR_DIAGRAM' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RETRY' }
  | { type: 'SET_RUNTIME'; runtime: LiveManagedRuntime };

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

    // Exécuter le programme Effect avec le runtime
    return runtime.runPromise(program)
    // const result = await Effect.runPromise(
    //   program.pipe(Effect.provide(runtime.layer)),
    // );

    // return result;
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
  },
  actions: {
    setRuntime: assign(({ context, event }) => {
      if (event.type !== 'SET_RUNTIME') return context;
      return {
        ...context,
        runtime: event.runtime,
      };
    }),

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

    clearDiagram: assign(({ context }) => ({
      ...context,
      lineId: null,
      diagramData: null,
      error: null,
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
          actions: assign(({ context, event }) => {
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
      on: {
        SET_RUNTIME: {
          actions: 'setRuntime',
        },
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
