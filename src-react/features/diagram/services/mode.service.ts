import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer, Logger } from 'effect';

import { ScadaClient, ScadaOutput } from '@/services/common/scada-client';
import { SldMetadata } from '@/types/sld-metadata';
import {
  GameMasterClient,
  GameMasterOutput,
} from '@/services/common/game-master-client';
import { ModeClient } from '@/services/common/mode-client';

const runtimeAtom = Atom.runtime(
  Layer.mergeAll(
    ScadaClient.Default,
    GameMasterClient.Default,
    ModeClient.Default,
  ).pipe(Layer.provideMerge(Logger.pretty)),
);

export type OutputResult =
  | { mode: 'GameMaster'; outputs: GameMasterOutput[] }
  | { mode: 'Scada'; outputs: ScadaOutput[] };

class NotImplementedError extends Error {
  readonly _tag = 'NotImplementedError';
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

const getOutputsEffect = (metadata: SldMetadata) =>
  Effect.gen(function* () {
    const modeClient = yield* ModeClient;
    const scadaClient = yield* ScadaClient;
    const gameMasterClient = yield* GameMasterClient;

    const currentMode = yield* modeClient.getCurrentMode();

    switch (currentMode) {
      case 'GameMaster': {
        const outputs = yield* gameMasterClient.getGameMasterOutputs(metadata);
        return { mode: 'GameMaster' as const, outputs } as OutputResult;
      }
      case 'Scada': {
        const outputs = yield* scadaClient.getScadaOutputs(metadata);
        return { mode: 'Scada' as const, outputs } as OutputResult;
      }
      case 'Kpi':
        return yield* Effect.fail(
          new NotImplementedError('Kpi mode not implemented yet'),
        );
      default:
        return yield* Effect.fail(
          new NotImplementedError(`Unknown mode: ${currentMode}`),
        );
    }
  });

export const getOutputs = runtimeAtom.fn(getOutputsEffect);
