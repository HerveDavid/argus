import {
  DefaultTauriConfig,
  TauriServiceLive,
} from '@/services/common/tauri-layer';
import {
  GameMasterService,
  GameMasterServiceLive,
} from '@/services/game-master';
import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer } from 'effect';

const GameMasterLayer = GameMasterServiceLive.pipe(
  Layer.provide(TauriServiceLive),
  Layer.provide(DefaultTauriConfig),
);

const runtime = Atom.runtime(GameMasterLayer);

export const setUrlAtom = runtime.fn((params: { url: string }) =>
  GameMasterService.pipe(
    Effect.flatMap((service) => service.setGameMasterUrl(params)),
  ),
);
