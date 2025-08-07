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

export type ReloaderEvent =
  | { type: 'LOAD_DIAGRAM'; lineId: string }
  | { type: 'CLEAR_DIAGRAM' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RETRY' }
  | { type: 'SET_RUNTIME'; runtime: LiveManagedRuntime }
  | { type: 'ENABLE_AUTO_REFRESH' }
  | { type: 'DISABLE_AUTO_REFRESH' }
  | { type: 'AUTO_REFRESH_TICK' }
  | { type: 'MANUAL_REFRESH' };

const reloadDiagramActor = fromPromise(
  async ({
    input,
  }: {
    input: { lineId: string; runtime: LiveManagedRuntime };
  }) => {
    const { lineId, runtime } = input;
    const program = Effect.gen(function* () {
      const projectClient = yield* ProjectClient;
      return yield* projectClient.getSingleLineDiagram(lineId);
    });

    return runtime.runPromise(program);
  },
);

export const reloaderMachine = setup({
  types: {
    context: {} as SldContext,
    events: {} as ReloaderEvent,
  },
  actors: {
    reloadDiagram: reloadDiagramActor,
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
  /** @xstate-layout N4IgpgJg5mDOIC5SwDYQCIEsCGUBO2AtgHSYQpgDEAygKIAqA+gEoCqAcvQJICytA2gAYAuolAAHAPaxMAF0ySAdmJAAPRADYAHACZiAVg079g-QHYALKYDMATgCMAGhABPRBet6t9nRa3WNT1sNM3sAXzDnVAwcfCJScioAGQB5AEF0RnQuNIBxZjSeIVEkECkZeSUVdQQNQXtiLTMTQSMdJttra2c3BGtdYmsfCzMzW0NjW0ELCKi0LFwCEjIKSlSMrJz8wv57EolpOQVlUprOs2JBc-0pq797btdEew1bPVGLW1sLfTtbLS0+lmIGiCziy0Sa3SmWyeQKRR0+zKh0qJ1AZ2sFyumJugju3kevR0OmsBiGJOab3MfmswNBsSWCVW6xhW3h-GsSPKRyqp0Q50u11u3wJPUQ+nsggM52svxaGleM0iIPmDPiKyoAGEkrQ0sxGJq0pqABICEQqbmo6qaMxaRo+EyAjT6CyunRihDtDTEXxfLT1f5mBWdOmqxbxADu2COiigADFJHhmABXRTyQhUOhMNicXhmrko47Wz0WHRSkL2JpGfT6AGyj2hC5TIyukJaBXTUMxcMkKMx+OJlNpzAZqEbWHbIrm0qWot8hD2ZoNCWGTxDUIkjQe3QXX1fMxlt4OIHK+k94h9+SxhNJ1Pp5LQzZwnZ7C2F3noxA6SW2Yhfb-+pYLwhGYHoaFYxDDP+wT2IYgi0qeYbghe0ZXgOt7DqO2q6vqE7stOBwVHOn4Llo-yDM2Zb2OMghaCMHoBFiLbtiMDyHl2YKMigkjYBAmCxpQEBKGApCKAAbpIADWIl4GA3G8ZxRDFG+REfk8C7fg0GiVpSLrHrYoFqIg1itFKdGYoEZYSj8J5zN2yHyXxAlgHgeCJsQ4goNgsgAGaJiQsmOYphDKTO75okZfSmY0HhBp4pj2DZHr2C8pLaU0Nx6bBBkcWqJCOZANAMCwHDcHwoWETyEU1IlKV-l8gavJYrbJW0gyxR4dimDcOi5eeBUQJQtDsGkABCOqMGkrD0CkLC0HGzC0NQxoVciqnVc8AR2raUwrsG7bJfoOjeu0wyriZIQIXZwXEANlDZNQY0TVNM1zQtS0rQRa1VcWDwKsQoRXL4OhTIuDzJR4UoAZYtrNOYLp9Q5PEQIVPBpOwrBpEkb2Lctq2zmpNWWL+vw+F0Vy6CDhm9C8pg+h1ZZ+GMvWIfZXHI6j6OY9ji3vXjr5hetv3E2SZMmf8xIGWBLqQb6dHEgCDyI+zvGFSyT6Tvj4W-V0DTkn43hOv8W7qQ8YwAzppbUQCIRKtdeW3Rzg3q3hL4FkL84PLRgxQXUvyAjWyXtGlEyuq6Zu-Mr8R3S7bI7IiKk-Z7IukyS4uU1LpvWwYocWJWNaeGYUf5U7Y6ss+RSconVrJ58otpxTkvU4gZjTMQLb-F83XfsXjuq4N2F6hr+Hu0nJEpZW7dWNWgggyZmKHcEFu+m2K8aL3d2D-qhomvm1fEZFiXe3uu3EtYnwWMlOnSpiFgKv4dZ2yqbPR6XqiwLI3kidgPmyC5AAULRBAAEpKBniRv3LWHtx4p3JOTCWVNWo1gBh1UYxhbLPxurJHyslYAAAt+JQEEsJUSElpLEGwbgvBwUoFj0PgCC4xMDJvFbrfLQyVWH01vkYaYjNbC90oXAAhzlXLuU8t5PyeAApgBwUImhX0CYbVIgZYg08SQOH6GYTE7pTYSj0JWB0iUyLz3CKzG6Lk3J4CKtmUqeZaE1xIj8FBDVGwmG+AZfQyUyJSlnp8TE-haw6EsL3CxiZKCLXoMwAAmvYg+NRjqknPmwyUWj2yEmeJ0PQW0gKLjaAqEJoirEROibsUeDjIoJPaskwQqTAgei+KSUObwfDy2+AUyxZdh47AUdreclSkmWG8DU-odTTb+G9BdXw58dLnwweAxkoSrGxwrqU-ehMvyBCqYMlJIz0kLglo0bQlhtBHU6D8dpYTlmawToLOh8TNkDPuMMtJyVpgWEuB3W0CVb4XKsVvLpU4ylxI2YkjqQzal7JMKCzE58rB2D8CGMxDtFmUH+TvU0sT1kIFLBwzof4WxWBqf4WUJ5lSKEkCjeApR5lEDWUogAtCbGmARLj6wVN+aYOle4ajpcWUI+hVHmXGVM7QTh1K-FJE0T4BIpg-H4Ui88l5CE3iHPeXlfTUrt3AtMI8wQ4UNjzpBKVUxQinxZvbfqyNCHqpIsdJx-wPAAisolQOptNLtx0plT42Ui4KogSjCANrD5umcV8V0xLjocJJKo1ovgUp+G+QImRVDrW3PKfElKpJY3eu-MERirVvyQXOCSHSJIn40pIIsoNNRbTt1CBlUwZF1HJS+A0WilgSWdCGOMCIEQgA */
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
        id: 'reloadDiagram',
        src: 'reloadDiagram',
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
      // Auto-refresh timer for 1 minutes
      after: {
        60000: [
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
        ENABLE_AUTO_REFRESH: [
          {
            guard: ({ context }) =>
              context.runtime !== null && context.lineId !== null,
            target: 'refreshing',
            actions: 'enableAutoRefresh',
          },
          {
            actions: 'enableAutoRefresh',
          },
        ],
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
        src: 'reloadDiagram',
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
