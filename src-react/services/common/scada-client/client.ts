import { Channel, invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';

import { SldMetadata } from '@/types/sld-metadata.ts';

import { ScadaError } from './errors.ts';
import { ScadaOutput } from './types.ts';
import { ScadaMessage } from '@/types/tstm.ts';

export interface ScadaService {
  readonly subscribeScadaFeeders: (
    metadata: SldMetadata,
    channel: Channel<ScadaMessage>,
  ) => Effect.Effect<ScadaOutput[], ScadaError>;

  readonly unsubscribeScadaFeeders: (
    outputs: ScadaOutput[],
  ) => Effect.Effect<boolean, ScadaError>;

  readonly unsubscribeAllScadaFeeders: () => Effect.Effect<void, ScadaError>;

  readonly getScadaOutputs: (
    metadata: SldMetadata,
  ) => Effect.Effect<ScadaOutput[], ScadaError>;
}

export class ScadaClient extends Effect.Service<ScadaService>()(
  '@/scada/feeders',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        subscribeScadaFeeders: (
          metadata,
          channel,
        ): Effect.Effect<ScadaOutput[], ScadaError> =>
          Effect.gen(function* () {
            const outputs = yield* Effect.tryPromise({
              try: () =>
                invoke<ScadaOutput[]>('subscribe_scada_feeders', {
                  metadata,
                  channel,
                }),
              catch: (error) =>
                new ScadaError({
                  message:
                    error instanceof Error ? error.message : String(error),
                }),
            });
            return outputs;
          }),

        unsubscribeScadaFeeders: (outputs): Effect.Effect<boolean, ScadaError> =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () =>
                invoke<boolean>('unsubscribe_scada_feeders', {
                  outputs,
                }),
              catch: (error) =>
                new ScadaError({
                  message:
                    error instanceof Error ? error.message : String(error),
                }),
            });
          }),

        unsubscribeAllScadaFeeders: (): Effect.Effect<void, ScadaError> =>
          Effect.gen(function* () {
            yield* Effect.tryPromise({
              try: () => invoke<void>('unsubscribe_all_scada_feeders'),
              catch: (error) =>
                new ScadaError({
                  message:
                    error instanceof Error ? error.message : String(error),
                }),
            });
          }),

        getScadaOutputs: (
          metadata: SldMetadata,
        ): Effect.Effect<ScadaOutput[], ScadaError> =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () =>
                invoke<ScadaOutput[]>('get_scada_outputs', {
                  metadata,
                }),
              catch: (error) =>
                new ScadaError({
                  message:
                    error instanceof Error ? error.message : String(error),
                }),
            });
          }),
      } satisfies ScadaService;
    }),
  },
) {}
