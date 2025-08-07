import {
  QueryClientProvider,
  QueryClient as TanstackQueryClient,
} from '@tanstack/react-query';
import { LogLevel } from 'effect';
import * as Duration from 'effect/Duration';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import React from 'react';

import { LiveManagedRuntime } from '@/config/live-layer';
import { ChannelClient } from '@/services/common/channel-client';
import { ProjectClient } from '@/services/common/project-client';
import { QueryClient } from '@/services/common/query-client';
import { SettingsClient } from '@/services/common/settings-client';
import { RuntimeProvider } from '@/services/runtime/runtime-provider';

import { StartupProvider } from './providers/startup.provider';
import { NatsClient } from '@/services/common/nats-client';
import { TaskClient } from '@/services/common/task-client';
import { FeederClient } from '@/services/common/feeder-client';

const InnerProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient: TanstackQueryClient = React.useMemo(
    () =>
      new TanstackQueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            retryDelay: 0,
            staleTime: Duration.toMillis('5 minutes'),
          },
          mutations: {
            retry: false,
            retryDelay: 0,
          },
        },
      }),
    [],
  );

  const runtime: LiveManagedRuntime = React.useMemo(
    () =>
      ManagedRuntime.make(
        Layer.mergeAll(
          QueryClient.make(queryClient),
          ChannelClient.Default,
          SettingsClient.Default,
          ProjectClient.Default,
          TaskClient.Default,
          FeederClient.Default,
          Logger.minimumLogLevel(LogLevel.Debug),
        ).pipe(
          Layer.provide(Logger.pretty),
          Layer.provideMerge(
            NatsClient.Default.pipe(Layer.provide(SettingsClient.Default)),
          ),
        ),
      ),
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <StartupProvider>{children}</StartupProvider>
      </RuntimeProvider>
    </QueryClientProvider>
  );
};

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <InnerProviders>{children}</InnerProviders>;
};
