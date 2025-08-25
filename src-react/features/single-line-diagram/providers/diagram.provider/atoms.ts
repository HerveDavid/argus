import { PowsyblClient } from '@/services/common/powsybl-client';
import { ScadaClient, ScadaOutput } from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import { ScadaMessage } from '@/types/tstm';
import { Atom } from '@effect-atom/atom-react';
import { Channel } from '@tauri-apps/api/core';
import { Effect, Layer } from 'effect';

const runtimeAtom = Atom.runtime(
  Layer.mergeAll(PowsyblClient.Default, ScadaClient.Default),
);

export const diagramAtom = runtimeAtom.fn(
  Effect.fn(function* (element_id: string) {
    const powsyblClient = yield* PowsyblClient;
    return yield* powsyblClient.getSingleLineDiagram({
      element_id,
    });
  }),
);

export const outputsAtom = runtimeAtom.fn(
  Effect.fn(function* (metadata: SldMetadata) {
    const scadaClient = yield* ScadaClient;
    return yield* scadaClient.getScadaOutputs(metadata);
  }),
);

export const scadaFeedersAtom = runtimeAtom.fn(
  Effect.fn(function* (metadata: SldMetadata) {
    const scadaClient = yield* ScadaClient;

    const channel = new Channel<ScadaMessage>();
    channel.onmessage = console.log;

    return yield* scadaClient.subscribeScadaFeeders(metadata, channel);
  }),
);

export const scadaUpdateFeedersAtom = runtimeAtom.fn(
  Effect.fn(function* ({
    metadata,
    update,
  }: {
    metadata: SldMetadata;
    update: (id: string, value: number) => boolean;
  }) {
    const scadaClient = yield* ScadaClient;

    // 1. D'abord récupérer tous les outputs SCADA
    const outputs = yield* scadaClient.getScadaOutputs(metadata);

    if (outputs.length === 0) {
      console.warn('No SCADA outputs found for metadata');
      return [];
    }

    console.log(
      `Found ${outputs.length} SCADA outputs:`,
      outputs.map((o) => o.id),
    );

    // 2. Créer un channel et une souscription pour chaque feeder
    const subscriptions: Array<() => void> = [];

    for (const output of outputs) {
      const channel = new Channel<ScadaMessage>();

      // Chaque channel a son propre message handler
      channel.onmessage = (message) => {
        console.log(`Received message for feeder ${output.id}:`, message);

        switch (message.format) {
          case 'TS_TM': {
            // Mettre à jour uniquement ce feeder spécifique
            update(message.graphical_id, message.value!);
            break;
          }
          case 'Legacy': {
            update(message.graphical_id, message.value!);
            break;
          }
          default: {
            console.warn(`Unknown message format: ${message.format}`);
          }
        }
      };

      // Souscrire à ce feeder spécifique
      try {
        const unsubscribe = yield* scadaClient.subscribeSingleScadaFeeder(
          output,
          channel,
        );
        // subscriptions.push(unsubscribe);
        console.log(`Subscribed to feeder: ${output.id}`);
      } catch (error) {
        console.error(`Failed to subscribe to feeder ${output.id}:`, error);
      }
    }

    // Retourner une fonction de cleanup qui désabonne tous les feeders
    return () => {
      console.log(`Cleaning up ${subscriptions.length} SCADA subscriptions`);
      subscriptions.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
    };
  }),
);

export const scadaCreateChannelsAtom = runtimeAtom.fn(
  Effect.fn(function* ({
    metadata,
    updateFeeder,
  }: {
    metadata: SldMetadata;
    updateFeeder: (id: string, value: number) => boolean;
  }) {
    const scadaClient = yield* ScadaClient;
    return yield* scadaClient.createScadaChannels(metadata, updateFeeder);
  }),
);

export const scadaRemoveFeedersAtom = runtimeAtom.fn(
  Effect.fn(function* (outputs: ScadaOutput[]) {
    const scadaClient = yield* ScadaClient;
    return yield* scadaClient.unsubscribeScadaFeeders(outputs);
  }),
);
