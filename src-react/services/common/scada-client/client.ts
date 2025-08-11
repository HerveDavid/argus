import { Channel, invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';

import { SldMetadata } from '@/types/sld-metadata.ts';

import { ScadaError } from './errors.ts';
import { ScadaOutput } from './types.ts'

export interface ScadaService {
  readonly subscribeScadaFeeders: (
    metadata: SldMetadata,
    channel: Channel<any>,
  ) => Effect.Effect<ScadaOutput[], ScadaError>;
}

export class ScadaClient extends Effect.Service<ScadaService>()(
  '@/scada/feeders',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        subscribeScadaFeeders: (metadata, channel): Effect.Effect<ScadaOutput[], ScadaError> =>
          Effect.gen(function* () {
            const outputs = yield* Effect.tryPromise({
              try: () => invoke<ScadaOutput[]>('subscribe_scada_feeders', {
                metadata,
                channel,
              }),
              catch: (error) =>
                new ScadaError({
                  message: error instanceof Error ? error.message : String(error),
                }),
            });
            return outputs;
          }),
      } satisfies ScadaService;
    }),
  },
) {}