import type * as Layer from 'effect/Layer';
import type * as ManagedRuntime from 'effect/ManagedRuntime';

import { ChannelClient } from '@/services/common/channel-client';
import { ProjectClient } from '@/services/common/project-client';
import { QueryClient } from '@/services/common/query-client';
import { SettingsClient } from '@/services/common/settings-client';
import { NatsClient } from '@/services/common/nats-client';

export type LiveLayerType = Layer.Layer<
  QueryClient | ChannelClient | SettingsClient | ProjectClient | NatsClient
>;
export type LiveManagedRuntime = ManagedRuntime.ManagedRuntime<
  Layer.Layer.Success<LiveLayerType>,
  never
>;
export type LiveRuntimeContext =
  ManagedRuntime.ManagedRuntime.Context<LiveManagedRuntime>;
