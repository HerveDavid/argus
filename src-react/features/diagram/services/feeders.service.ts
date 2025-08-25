import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer } from 'effect';

import {
  ScadaClient,
  ScadaError,
  ScadaOutput,
} from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import { Channel } from '@tauri-apps/api/core';
import { ScadaMessage } from '@/types/tstm';
import { updateFeeder } from '../utils/update-feeder';

const runtimeAtom = Atom.runtime(Layer.mergeAll(ScadaClient.Default));

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
              const channel = new Channel<ScadaMessage>();

              channel.onmessage = (message) => {
                if (
                  svgRef &&
                  (message.format === 'TS_TM' || message.format === 'Legacy')
                ) {
                  updateFeeder(svgRef, output.graphical_id, message.value!);
                  console.log(`${output.id} received message: `, message);
                }

              };

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
