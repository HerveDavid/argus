// scada-feeders.machine.ts
import { Effect } from 'effect';
import { assign, fromPromise, setup } from 'xstate';

import { LiveManagedRuntime } from '@/config/live-layer';
import { ScadaClient } from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import { Channel } from '@tauri-apps/api/core';
import { ScadaMessage } from '@/types/tstm';
import { ScadaOutput } from '@/services/common/scada-client/types';
import {
  ScadaDataPoint,
  createScadaDataPoint,
} from '@/services/common/scada-client';

export interface ScadaFeedersContext {
  metadata: SldMetadata | null;
  error: string | null;
  runtime: LiveManagedRuntime | null;
  lastSubscription: Date | null;
  isSubscribed: boolean;
  scadaOutputs: ScadaOutput[];
  onDataPoint?: (dataPoint: ScadaDataPoint) => void; // ✅ Handler pour ScadaDataPoint
}

export type ScadaFeedersEvent =
  | {
      type: 'SUBSCRIBE';
      metadata: SldMetadata;
      onDataPoint?: (dataPoint: ScadaDataPoint) => void; // ✅ Changé pour ScadaDataPoint
    }
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

    const onEvent = new Channel<ScadaMessage>();
    onEvent.onmessage = (message) => {
      console.log(`got ${message}`);
    };

    const program = Effect.gen(function* () {
      const scadaClient = yield* ScadaClient;
      const outputs = yield* scadaClient.subscribeScadaFeeders(
        metadata,
        onEvent,
      );
      return { metadata, outputs };
    });

    return runtime.runPromise(program);
  },
);

const subscribeScadaFeedersActorWIP = fromPromise(
  async ({
    input,
  }: {
    input: {
      metadata: SldMetadata;
      runtime: LiveManagedRuntime;
      scadaOutputs: ScadaOutput[]; // ✅ Ajout des outputs pour le morphisme
      onDataPoint: (dataPoint: ScadaDataPoint) => void; // ✅ Handler pour ScadaDataPoint
    };
  }) => {
    const { metadata, runtime, scadaOutputs, onDataPoint } = input;

    // Créer une Map des outputs pour une recherche rapide par ID
    const outputsMap = new Map(
      scadaOutputs.map((output) => [output.id, output]),
    );

    const onEvent = new Channel<ScadaMessage>();

    // ✅ Morphisme: ScadaMessage -> ScadaDataPoint
    onEvent.onmessage = (message: ScadaMessage) => {
      const output = outputsMap.get(message.id);

      if (output) {
        const dataPoint = createScadaDataPoint(output, message);
        if (dataPoint) {
          onDataPoint(dataPoint);
        } else {
          console.warn(
            `Failed to create ScadaDataPoint for message ID: ${message.id}`,
          );
        }
      } else {
        console.table(scadaOutputs);
        console.warn(`No ScadaOutput found for message ID: ${JSON.stringify(message)}`);
      }
    };

    const program = Effect.gen(function* () {
      const scadaClient = yield* ScadaClient;
      const outputs = yield* scadaClient.subscribeScadaFeeders(
        metadata,
        onEvent,
      );
      return { metadata, outputs };
    });

    return runtime.runPromise(program);
  },
);

const unsubscribeScadaFeedersActor = fromPromise(
  async ({
    input,
  }: {
    input: { outputs: ScadaOutput[]; runtime: LiveManagedRuntime };
  }) => {
    const { outputs, runtime } = input;

    const program = Effect.gen(function* () {
      const scadaClient = yield* ScadaClient;
      yield* scadaClient.unsubscribeScadaFeeders(outputs);
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
    subscribeScadaFeedersWIP: subscribeScadaFeedersActorWIP,
    unsubscribeScadaFeeders: unsubscribeScadaFeedersActor,
  },
  guards: {
    hasRuntime: ({ context }) => {
      return context.runtime !== null;
    },
    isSameMetadata: ({ context, event }) => {
      if (event.type !== 'SUBSCRIBE') return false;
      return (
        JSON.stringify(context.metadata) === JSON.stringify(event.metadata)
      );
    },
    hasOutputsToUnsubscribe: ({ context }) => {
      return context.scadaOutputs.length > 0;
    },
    // ✅ Nouveau guard pour vérifier si on a un handler
    hasDataPointHandler: ({ context }) => {
      return context.onDataPoint !== undefined;
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

    // ✅ Mise à jour pour inclure le handler
    setMetadata: assign(({ context, event }) => {
      if (event.type !== 'SUBSCRIBE') return context;
      return {
        ...context,
        metadata: event.metadata,
        onDataPoint: event.onDataPoint, // Sauvegarder le handler dans le contexte
        error: null,
      };
    }),

    clearSubscription: assign(({ context }) => ({
      ...context,
      metadata: null,
      error: null,
      lastSubscription: null,
      isSubscribed: false,
      scadaOutputs: [],
      onDataPoint: undefined, // ✅ Nettoyer le handler
    })),

    clearError: assign(({ context }) => ({
      ...context,
      error: null,
    })),

    updateLastSubscriptionTime: assign(({ context, event }) => {
      const outputData = event.output as {
        metadata: SldMetadata;
        outputs: ScadaOutput[];
      };
      return {
        ...context,
        lastSubscription: new Date(),
        isSubscribed: true,
        scadaOutputs: outputData.outputs,
      };
    }),

    clearOutputs: assign(({ context }) => ({
      ...context,
      scadaOutputs: [],
      isSubscribed: false,
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
    scadaOutputs: [],
    onDataPoint: undefined, // ✅ Initialiser le handler
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
    // ✅ Mise à jour de l'état subscribing pour choisir le bon acteur
    subscribing: {
      invoke: [
        {
          // Utiliser l'acteur WIP si on a un handler de dataPoint ET des outputs existants
          guard: ({ context }) =>
            context.onDataPoint !== undefined &&
            context.scadaOutputs.length > 0,
          id: 'subscribeScadaFeedersWIP',
          src: 'subscribeScadaFeedersWIP',
          input: ({ context }) => ({
            metadata: context.metadata!,
            runtime: context.runtime!,
            scadaOutputs: context.scadaOutputs, // ✅ Passer les outputs existants
            onDataPoint: context.onDataPoint!,
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
        {
          // Utiliser l'acteur classique si pas de handler ou pas d'outputs
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
      ],
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
            target: 'unsubscribing',
            actions: 'setMetadata',
          },
          {
            target: 'waitingForRuntime',
            actions: 'setMetadata',
          },
        ],
        UNSUBSCRIBE: [
          {
            guard: 'hasOutputsToUnsubscribe',
            target: 'unsubscribing',
          },
          {
            target: 'idle',
            actions: 'clearSubscription',
          },
        ],
        CLEAR_ERROR: {
          actions: 'clearError',
        },
      },
    },
    unsubscribing: {
      invoke: {
        id: 'unsubscribeScadaFeeders',
        src: 'unsubscribeScadaFeeders',
        input: ({ context }) => ({
          outputs: context.scadaOutputs,
          runtime: context.runtime!,
        }),
        onDone: [
          {
            guard: ({ context }) => context.metadata !== null,
            target: 'subscribing',
            actions: 'clearOutputs',
          },
          {
            target: 'idle',
            actions: 'clearSubscription',
          },
        ],
        onError: {
          target: 'error',
          actions: assign(({ context, event }) => ({
            ...context,
            error: String(event.error) || 'Erreur de désouscription inconnue',
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
        UNSUBSCRIBE: [
          {
            guard: 'hasOutputsToUnsubscribe',
            target: 'unsubscribing',
          },
          {
            target: 'idle',
            actions: 'clearSubscription',
          },
        ],
        CLEAR_ERROR: {
          actions: 'clearError',
        },
      },
    },
  },
});
