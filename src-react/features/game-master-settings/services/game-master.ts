import {
  DefaultTauriConfig,
  TauriServiceLive,
} from '@/services/common/tauri-layer';
import {
  GameMasterService,
  GameMasterServiceLive,
} from '@/services/game-master';
import { withToast } from '@/services/utils';
import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer } from 'effect';

const GameMasterLayer = GameMasterServiceLive.pipe(
  Layer.provide(TauriServiceLive),
  Layer.provide(DefaultTauriConfig),
);

const runtime = Atom.runtime(GameMasterLayer);

export const setUrlAtom = runtime.fn(
  Effect.fn(
    function* (params: { url: string }) {
      const gm = yield* GameMasterService;
      return yield* gm.setGameMasterUrl(params);
    },
    withToast({
      onWaiting: (payload) => `GameMaster try to set url ${payload.url}`,
      onSuccess: (payload) => `GameMaster setting url ${payload.url}`,
      onFailure: `GameMaster failed to set url`,
    }),
  ),
);

export const getUrlAtom = runtime.fn(() =>
  GameMasterService.pipe(
    Effect.flatMap((service) => service.getGameMasterUrl()),
  ),
);
