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

    const channel = new Channel<ScadaMessage>();
    channel.onmessage = (message) => {
      switch (message.format) {
        case 'TS_TM': {
          update(message.graphical_id, message.value!);
        }
        case 'Legacy': {
          update(message.graphical_id, message.value!);
        }
        default: {
        }
      }
      console.log(message);
    };

    return yield* scadaClient.subscribeScadaFeeders(metadata, channel);
  }),
);

export const scadaRemoveFeedersAtom = runtimeAtom.fn(
  Effect.fn(function* (outputs: ScadaOutput[]) {
    const scadaClient = yield* ScadaClient;
    return yield* scadaClient.unsubscribeScadaFeeders(outputs);
  }),
);
