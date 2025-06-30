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

export type LoaderEvent =
  | { type: 'LOAD_DIAGRAM'; lineId: string }
  | { type: 'CLEAR_DIAGRAM' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RETRY' }
  | { type: 'SET_RUNTIME'; runtime: LiveManagedRuntime }
  | { type: 'ENABLE_AUTO_REFRESH' }
  | { type: 'DISABLE_AUTO_REFRESH' }
  | { type: 'AUTO_REFRESH_TICK' }
  | { type: 'MANUAL_REFRESH' };

const loadDiagramActor = fromPromise(
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

export const loaderMachine = setup({
  types: {
    context: {} as SldContext,
    events: {} as LoaderEvent,
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
  /** @xstate-layout N4IgpgJg5mDOIC5SwDYQCIEsCGUBO2AtgHSYQpgDEAygKIAqA+gEoCqAcvQJICytA2gAYAuolAAHAPaxMAF0ySAdmJAAPRADYAHACZiAVg079g-QHYALKYDMATgCMAGhABPRBet6t9nRa3WNT1sNM3sAXzDnVAwcfCJScioAGQB5AEF0RnQuNIBxZjSeIVEkECkZeSUVdQQNQXtiLTMTQSMdJttra2c3BGtdYmsfCzMzW0NjW0ELCKi0LFwCEjIKSlSMrJz8wv57EolpOQVlUprOs2JBc-0pq797btdEew1bPVGLW1sLfTtbLS0+lmIGiCziy0Sa3SmWyeQKRR0+zKh0qJ1AZ2sFyumJugju3kevR0OmsBiGJOab3MfmswNBsSWCVW6xhW3h-GsSPKRyqp0Q50u11u3wJPUQ+nsggM52svxaGleM0iIPmDPiKyoAGEkrQ0sxGJq0pqABICEQqbmo6qaMxaRo+EyAjT6CyunRihDtDTEXxfLT1f5mBWdOmqxbxADu2COiigADFJHhmABXRTyQhUOhMNicXhmrko47Wz0WHRSkL2JpGfT6AGyj2hC5TIyukJaBXTUMxcMkKMx+OJlNpzAZqEbWHbIrm0qWot8hD2ZoNCWGTxDUIkjQe3QXX1fMxlt4OIHK+k94h9+SxhNJ1Pp5LQzZwnZ7C2F3noxA6SW2Yhfb-+pYLwhGYHoaFYxDDP+wT2IYgi0qeYbghe0ZXgOt7DqO2q6vqE7stOBwVHOn4Llo-yDM2Zb2OMghaCMHoBFiLbtiMDyHl2YKMigkjYBAmCxpQEBKGApCKAAbpIADWIncbxnFEMUb5ER+ahfqW5ahFWxi1v4+geg8hiNNoS4eOB1FKnM3bIbJfECWAeB4ImxDiCg2CyAAZomJA2fJhCKTO75oqpJYWN6AFBmWNx0a024NJ8XxvOS-imBxareTxECQDQDAsBw3B8P5hE8kFNT2BY9gNAlgavJYrb6W0gweJYXRTDWbypeeNlZbQ7BpAAQjqjBpKw9ApCwtBxswtDUMahXIspJXPAEdq2q1sHBu2+n6DoYXeL4q7WK0ZgIZZvnEF1ECUNk1D9YNw2jeNk3TbNBHzcVxYPAqxChFcvg6FMi4PPpHhSuFIxNDWzQWSqVlcRlWU8Gk7CsGkSSPVNM1zbOKmlZYv6-D4XRXLo-2gU8C51PoPpNepfhjDoHXWfDl2I8jqPo89uwFgtH142ShOHf8xK2GTvTOhYkG+nRxIAg8jNw7xWUsk+k5Y4FH1dA05J+N4Tr-Fu5MPGM32VpY37-O2ljy-EF1jqyz5FK+AU8-ODy0YMUGU-0NZ6Yb7Sks6LauuVOInTDZ228reE7IiSnva7fMEySgskyL+nUXaNZB5WNaeGY1vpYrl1R2yOycnHVoJ58-PJ8Twui4gZjTMQLb-F8pjbeEiGwzbzOUNheoq-h3PxyRFWVi3VjVoI-2HZiW3BCbvptsvGgF+dfcD-qhomvmFfEcFZXu3urXEtYnwWOnTTSpioXaP0-jQ2eTNF5QqiwLIbkidg7myPZAAULRBAAEpKDPwVplCAasXZj0TuSImQtSb1RrN9GmoxtLrzwGAdyWDYAAAt+JQEEsJUSElpLECwTguAeDfLQNHofAEFw8YizeE3W+Wh9JsOprfIw0wyyfEwdg3BBC7IOSci5Nynk8AkEocI2hr1saLVIiLYgU8SQOH6MdA8W0fCQT2hKPwnR4Jd1OmlYg9lHJ4GytmPKeY6GVxIj8VBCVGwmG+CLX2vRKxTEuL6TEukdxPyQoyCxiZKBTXoMwAAmvYg+NQdqknPuwyUx12yEmeJ0PQy0gKLjaAqdeoSrEROiVzfeOMvyBEaskwQqTAgei+KSCYnxvztFLN8ApYirElwdrE8pnpKlJMsN4Gp-Q6mG38N6Q6LZz6m3PieUx55Cl2yHi+EeDjgoJKqUMlJoz0kLiFkZJooVASzx+B0yxyzo4IjWXEipiSabDNqXsyUrpLit1tKYI2QSe4kCWVvFZU4bl9M2YM+4Iy0kehMPczE58rB2EMWHcB8Q-k6kHjvU0vSlGlk4Z0P8Qc8S2i6DWCIypFCSEyvAUoSLCBlKUQAWgNr0OlVMqqsqqu2deGpaXFlCFTPwHgJm+GWk4cmvxSRHP+A8KYPxbDr0vIQm8Q57zcvnN+SpCorDNK+OBeCDZyp6LxjU6iphiTrxsoQlVJEdpOP+AK3QnyfieOeN+BoGhTY3BdMeEWZrmaWsPm6ZxXxXT+E8Iy54B5SRqPKmVf0EpEXBPiLI6hFrnb0PiRVUkrRfQ+GooEEI9VvyQXOCSU2JJvlnUKX6motoW6aWaKYMi6j9JfAaLRZqbVNbjBJWEIAA */
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
      // Auto-refresh timer de 1 minutes
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