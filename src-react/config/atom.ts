import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer, Logger } from 'effect';

import { SessionClient } from '@/services/common/session-client';
import { SettingsClient } from '@/services/common/settings-client';
import { NatsClient } from '@/services/common/nats-client';
import { PowsyblClient } from '@/services/common/powsybl-client';
import { ModeClient } from '@/services/common/mode-client';

export const makeAtomRuntime = Atom.context({ memoMap: Atom.defaultMemoMap });
makeAtomRuntime.addGlobalLayer(
  Layer.mergeAll(
    SessionClient.Default,
    SettingsClient.Default,
    PowsyblClient.Default,
    ModeClient.Default,
  ).pipe(
    Layer.provideMerge(Logger.pretty),
    Layer.tapErrorCause(Effect.logError),
    Layer.provideMerge(
      NatsClient.Default.pipe(Layer.provide(SettingsClient.Default)),
    ),
  ),
);
