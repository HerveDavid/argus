import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer, Logger } from 'effect';
import { createStore } from 'jotai/vanilla';

import {
  ScadaClient,
  ScadaError,
  ScadaOutput,
} from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import { Channel } from '@tauri-apps/api/core';
import { ScadaMessage } from '@/types/tstm';
import { updateFeeder } from '../utils/update-feeder';
import { addScadaMessageAtom } from '../stores/scada-message.store';

const runtimeAtom = Atom.runtime(
  Layer.mergeAll(ScadaClient.Default).pipe(Layer.provideMerge(Logger.pretty)),
);

// Store Jotai standalone pour être utilisé dans les callbacks
const jotaiStore = createStore();

type LoadFeedersProps = {
  metadata: SldMetadata;
  svgRef: React.RefObject<SVGSVGElement>;
};

export const loadFeeders = Atom.family(
  ({ metadata, svgRef }: LoadFeedersProps) =>
    runtimeAtom.fn(
      Effect.fn(function* () {
        const scadaClient = yield* ScadaClient;

        const outputs = yield* scadaClient.getScadaOutputs(metadata);

        if (!outputs || outputs.length == 0) {
          return yield* new ScadaError({ message: 'Outputs is empty' });
        }

        yield* Effect.forEach(
          outputs,
          (output) =>
            Effect.gen(function* () {
              // Buffer simple pour collecter les messages
              const messageBuffer: ScadaMessage[] = [];
              let bufferTimeout: number | null = null;

              const channel = new Channel<ScadaMessage>();

              // Fonction pour traiter le buffer
              const flushBuffer = () => {
                if (messageBuffer.length === 0) return;

                const messages = [...messageBuffer];
                messageBuffer.length = 0; // Clear buffer
                bufferTimeout = null;

                // Traitement par batch avec Effect
                Effect.runSync(
                  Effect.gen(function* () {
                    // Ajouter au store Jotai
                    yield* Effect.sync(() => {
                      messages.forEach((message) => {
                        jotaiStore.set(addScadaMessageAtom, message);
                      });
                    });

                    // Log du batch
                    yield* Effect.logDebug(
                      `${output.id} processed ${messages.length} messages`,
                    );
                  }),
                );
              };

              // Le callback met à jour le SVG immédiatement ET accumule pour le batch
              channel.onmessage = (message) => {
                if (
                  svgRef &&
                  (message.format === 'TS_TM' || message.format === 'Legacy')
                ) {
                  // Mise à jour SVG immédiate pour la réactivité
                  updateFeeder(svgRef, output.graphical_id, message.value!);

                  // Ajouter au buffer simple
                  messageBuffer.push(message);

                  // Flush immédiat si buffer plein
                  if (messageBuffer.length >= 50) {
                    if (bufferTimeout) clearTimeout(bufferTimeout);
                    flushBuffer();
                  }
                  // Sinon programmer un flush
                  else if (!bufferTimeout) {
                    bufferTimeout = setTimeout(
                      flushBuffer,
                      200,
                    ) as unknown as number;
                  }
                }
              };

              // Subscribe au canal SCADA
              yield* scadaClient.subscribeScadaFeeders(metadata, channel);
            }),
          { concurrency: 'unbounded' },
        );

        return outputs;
      }),
    ),
);

export const removeFeeders = runtimeAtom.fn(
  Effect.fn(function* (outputs: ScadaOutput[]) {
    const scadaClient = yield* ScadaClient;
    return yield* scadaClient.unsubscribeScadaFeeders(outputs);
  }),
);
