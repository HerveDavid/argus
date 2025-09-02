import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer, Logger } from 'effect';

import { ScadaClient } from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import { Channel } from '@tauri-apps/api/core';
import { ScadaMessage } from '@/types/tstm';

const runtimeAtom = Atom.runtime(
  Layer.mergeAll(ScadaClient.Default).pipe(Layer.provideMerge(Logger.pretty)),
);

type LoadFeedersProps = {
  metadata: SldMetadata;
  id: string;
  channelRef: React.RefObject<Channel<ScadaMessage> | undefined>;
};

export const loadFeeders = Atom.family(
  ({ metadata, id, channelRef }: LoadFeedersProps) =>
    runtimeAtom.fn(
      Effect.fn(function* () {
        const scadaClient = yield* ScadaClient;

        if (channelRef.current) {
          yield* scadaClient.subscribeScadaFeeders(
            metadata,
            id,
            channelRef.current,
          );
        }
      }),
    ),
);

export const removeFeeders = Atom.family(({ id }: { id: string }) =>
  runtimeAtom.fn(
    Effect.fn(function* () {
      const scadaClient = yield* ScadaClient;
      return yield* scadaClient.unsubscribeScadaFeeders(id);
    }),
  ),
);
