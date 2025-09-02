import { Atom } from '@effect-atom/atom-react';
import { Channel } from '@tauri-apps/api/core';
import { Effect, Layer, Logger } from 'effect';

import { ScadaClient } from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import { ScadaMessage } from '@/types/tstm';

const runtimeAtom = Atom.runtime(
  Layer.mergeAll(ScadaClient.Default).pipe(Layer.provideMerge(Logger.pretty)),
);

type SubscribeToFeedersProps = {
  metadata: SldMetadata;
  subscriptionId: string;
  scadaChannel: React.RefObject<Channel<ScadaMessage> | undefined>;
};

type UnsubscribeFromFeedersProps = {
  subscriptionId: string;
};

export const subscribeToFeeders = Atom.family(
  ({ metadata, subscriptionId, scadaChannel }: SubscribeToFeedersProps) =>
    runtimeAtom.fn(
      Effect.fn(function* () {
        const scadaClient = yield* ScadaClient;

        if (scadaChannel.current) {
          yield* scadaClient.subscribeScadaFeeders(
            metadata,
            subscriptionId,
            scadaChannel.current,
          );
        }
      }),
    ),
);

export const unsubscribeFromFeeders = Atom.family(
  ({ subscriptionId }: UnsubscribeFromFeedersProps) =>
    runtimeAtom.fn(
      Effect.fn(function* () {
        const scadaClient = yield* ScadaClient;
        return yield* scadaClient.unsubscribeScadaFeeders(subscriptionId);
      }),
    ),
);
