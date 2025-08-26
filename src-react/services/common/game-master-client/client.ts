import * as Effect from 'effect/Effect';

import { SldMetadata } from '@/types/sld-metadata.ts';

import { GameMasterError } from './errors.ts';
import { GameMasterOutput } from './types.ts';
import { invoke } from '@tauri-apps/api/core';

export interface GameMasterService {
  readonly getGameMasterOutputs: (
    metadata: SldMetadata,
  ) => Effect.Effect<GameMasterOutput[], GameMasterError>;
}

export class GameMasterClient extends Effect.Service<GameMasterService>()(
  '@/game_master/feeders',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        getGameMasterOutputs: (
          metadata: SldMetadata,
        ): Effect.Effect<GameMasterOutput[], GameMasterError> =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise({
              try: () =>
                invoke<GameMasterOutput[]>('get_game_master_outputs', {
                  metadata,
                }),
              catch: (error) =>
                new GameMasterError({
                  message:
                    error instanceof Error ? error.message : String(error),
                }),
            });
          }),
      } satisfies GameMasterService;
    }),
  },
) {}
