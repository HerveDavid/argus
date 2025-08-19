import { Rx } from '@effect-rx/rx-react';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { MainLayer } from '@/config/runtime';
import { FeederClient } from '../services/feeder-client';
import { ScadaClient } from '@/services/common/scada-client';
import { ScadaSubscriptionClient } from './scada-subscription';

const memoMap = Effect.runSync(Layer.makeMemoMap);

const SldLayer = Layer.mergeAll(
  MainLayer,
  FeederClient.Default,
  ScadaClient.Default,
  ScadaSubscriptionClient.Default,
);

export const runtime = ManagedRuntime.make(SldLayer, memoMap);
export const makeRxRuntime = Rx.context({ memoMap });
export const rxRuntime = makeRxRuntime(SldLayer);
