import type * as Layer from 'effect/Layer';
import type * as ManagedRuntime from 'effect/ManagedRuntime';

import { ChannelClient } from './common/channel-client';
import { QueryClient } from './common/query-client';
import { SettingsClient } from './common/settings-client';

export type LiveLayerType = Layer.Layer<
  QueryClient | ChannelClient | SettingsClient
>;
export type LiveManagedRuntime = ManagedRuntime.ManagedRuntime<
  Layer.Layer.Success<LiveLayerType>,
  never
>;
export type LiveRuntimeContext =
  ManagedRuntime.ManagedRuntime.Context<LiveManagedRuntime>;
