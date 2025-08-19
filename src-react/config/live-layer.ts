import type * as Layer from 'effect/Layer';
import type * as ManagedRuntime from 'effect/ManagedRuntime';

import { ChannelClient } from '@/services/common/channel-client';
import { QueryClient } from '@/services/common/query-client';
import { SettingsClient } from '@/services/common/settings-client';
import { NatsClient } from '@/services/common/nats-client';
import { TaskClient } from '@/services/common/task-client';
import { FeederClient } from '@/services/common/feeder-client';
import { ScadaClient } from '@/services/common/scada-client';

export type LiveLayerType = Layer.Layer<
  | QueryClient
  | ChannelClient
  | SettingsClient
  | NatsClient
  | TaskClient
  | FeederClient
  | ScadaClient
>;
export type LiveManagedRuntime = ManagedRuntime.ManagedRuntime<
  Layer.Layer.Success<LiveLayerType>,
  never
>;
export type LiveRuntimeContext =
  ManagedRuntime.ManagedRuntime.Context<LiveManagedRuntime>;
