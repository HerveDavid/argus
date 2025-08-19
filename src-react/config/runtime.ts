import { Rx } from '@effect-rx/rx-react';
import { Effect, Layer, Logger, ManagedRuntime } from 'effect';
import { SessionClient } from '@/services/common/session-client';
import { SettingsClient } from '@/services/common/settings-client';
import { NatsClient } from '@/services/common/nats-client';
import { PowsyblClient } from '@/services/common/powsybl-client';

const memoMap = Effect.runSync(Layer.makeMemoMap);

export const MainLayer = Layer.mergeAll(
  SessionClient.Default,
  SettingsClient.Default,
  PowsyblClient.Default,
).pipe(
  Layer.provideMerge(Logger.pretty),
  Layer.tapErrorCause(Effect.logError),
  Layer.provideMerge(
    NatsClient.Default.pipe(Layer.provide(SettingsClient.Default)),
  ),
);

export const runtime = ManagedRuntime.make(MainLayer, memoMap);
export const makeRxRuntime = Rx.context({ memoMap });
export const rxRuntime = makeRxRuntime(MainLayer);
