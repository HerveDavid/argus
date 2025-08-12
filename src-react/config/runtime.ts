import { Rx } from '@effect-rx/rx-react';
import { Effect, Layer, Logger, ManagedRuntime } from 'effect';
import { SessionClient } from '@/services/session';
import { SettingsClient } from '@/services/common/settings-client';

const memoMap = Effect.runSync(Layer.makeMemoMap);

const MainLayer = Layer.mergeAll(
  SessionClient.Default,
  SettingsClient.Default,
).pipe(Layer.provideMerge(Logger.pretty), Layer.tapErrorCause(Effect.logError));

export const runtime = ManagedRuntime.make(MainLayer, memoMap);
export const makeRxRuntime = Rx.context({ memoMap });
export const rxRuntime = makeRxRuntime(MainLayer);
