// scada-feeders.machine.ts
import { Effect } from 'effect';
import { assign, fromPromise, setup } from 'xstate';

import { LiveManagedRuntime } from '@/config/live-layer';
import { ScadaClient } from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import { Channel } from '@tauri-apps/api/core';

export interface ScadaFeedersContext {
  metadata: SldMetadata | null;
  error: string | null;
  runtime: LiveManagedRuntime | null;
  lastSubscription: Date | null;
  isSubscribed: boolean;
}

export type ScadaFeedersEvent =
  | { type: 'SUBSCRIBE'; metadata: SldMetadata }
  | { type: 'UNSUBSCRIBE' }
  | { type: 'RETRY' }
  | { type: 'SET_RUNTIME'; runtime: LiveManagedRuntime }
  | { type: 'CLEAR_ERROR' };

const subscribeScadaFeedersActor = fromPromise(
  async ({
           input,
         }: {
    input: { metadata: SldMetadata; runtime: LiveManagedRuntime };
  }) => {
    const { metadata, runtime } = input;
    const program = Effect.gen(function* () {

      // TODO
      const onEvent = new Channel<any>();
      onEvent.onmessage = (message) => {
        console.log(`got download event ${message.event}`);
      };

      const scadaClient = yield* ScadaClient;
      yield* scadaClient.subscribeScadaFeeders(metadata, onEvent);
      return metadata;
    });

    return runtime.runPromise(program);
  },
);

export const scadaFeedersMachine = setup({
  types: {
    context: {} as ScadaFeedersContext,
    events: {} as ScadaFeedersEvent,
  },
  actors: {
    subscribeScadaFeeders: subscribeScadaFeedersActor,
  },
  guards: {
    hasRuntime: ({ context }) => {
      return context.runtime !== null;
    },
    isSameMetadata: ({ context, event }) => {
      if (event.type !== 'SUBSCRIBE') return false;
      return JSON.stringify(context.metadata) === JSON.stringify(event.metadata);
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

    setMetadata: assign(({ context, event }) => {
      if (event.type !== 'SUBSCRIBE') return context;
      return {
        ...context,
        metadata: event.metadata,
        error: null,
      };
    }),

    clearSubscription: assign(({ context }) => ({
      ...context,
      metadata: null,
      error: null,
      lastSubscription: null,
      isSubscribed: false,
    })),

    clearError: assign(({ context }) => ({
      ...context,
      error: null,
    })),

    updateLastSubscriptionTime: assign(({ context }) => ({
      ...context,
      lastSubscription: new Date(),
      isSubscribed: true,
    })),
  },
}).createMachine({
  id: 'scadaFeeders',
  initial: 'idle',
  context: {
    metadata: null,
    error: null,
    runtime: null,
    lastSubscription: null,
    isSubscribed: false,
  },
  states: {
    idle: {
      on: {
        SET_RUNTIME: {
          actions: 'setRuntime',
        },
        SUBSCRIBE: [
          {
            guard: 'hasRuntime',
            target: 'subscribing',
            actions: 'setMetadata',
          },
          {
            target: 'waitingForRuntime',
            actions: 'setMetadata',
          },
        ],
      },
    },
    waitingForRuntime: {
      on: {
        SET_RUNTIME: {
          target: 'subscribing',
          actions: 'setRuntime',
        },
        SUBSCRIBE: {
          target: 'waitingForRuntime',
          actions: 'setMetadata',
        },
        UNSUBSCRIBE: {
          target: 'idle',
          actions: 'clearSubscription',
        },
      },
    },
    subscribing: {
      invoke: {
        id: 'subscribeScadaFeeders',
        src: 'subscribeScadaFeeders',
        input: ({ context }) => ({
          metadata: context.metadata!,
          runtime: context.runtime!,
        }),
        onDone: {
          target: 'subscribed',
          actions: ['updateLastSubscriptionTime'],
        },
        onError: {
          target: 'error',
          actions: assign(({ context, event }) => ({
            ...context,
            error: String(event.error) || 'Erreur de souscription inconnue',
            isSubscribed: false,
          })),
        },
      },
    },
    subscribed: {
      on: {
        SET_RUNTIME: {
          actions: 'setRuntime',
        },
        SUBSCRIBE: [
          {
            guard: 'isSameMetadata',
            target: 'subscribed',
          },
          {
            guard: 'hasRuntime',
            target: 'subscribing',
            actions: 'setMetadata',
          },
          {
            target: 'waitingForRuntime',
            actions: 'setMetadata',
          },
        ],
        UNSUBSCRIBE: {
          target: 'idle',
          actions: 'clearSubscription',
        },
        CLEAR_ERROR: {
          actions: 'clearError',
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
            target: 'subscribing',
          },
          {
            target: 'waitingForRuntime',
          },
        ],
        SUBSCRIBE: [
          {
            guard: 'hasRuntime',
            target: 'subscribing',
            actions: 'setMetadata',
          },
          {
            target: 'waitingForRuntime',
            actions: 'setMetadata',
          },
        ],
        UNSUBSCRIBE: {
          target: 'idle',
          actions: 'clearSubscription',
        },
        CLEAR_ERROR: {
          actions: 'clearError',
        },
      },
    },
  },
});
