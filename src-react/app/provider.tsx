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
import { ModeProvider } from '@/hooks/use-mode';
import { ChannelClient } from '@/services/common/channel-client';
import { FeederClient } from '@/services/common/feeder-client';
import { NatsClient } from '@/services/common/nats-client';
import { PowsyblClient } from '@/services/common/powsybl-client';
import { QueryClient } from '@/services/common/query-client';
import { ScadaClient } from '@/services/common/scada-client';
import { SettingsClient } from '@/services/common/settings-client';
import { TaskClient } from '@/services/common/task-client';
import { RuntimeProvider } from '@/services/runtime/runtime-provider';

import { RegistryProvider } from '@effect-rx/rx-react';
import { InitProvider } from './providers/init.provider';
import { ModeClient } from '@/services/common/mode-client';

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
          PowsyblClient.Default,
          ScadaClient.Default,
          TaskClient.Default,
          FeederClient.Default,
          ModeClient.Default,
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
    <RegistryProvider>
      <QueryClientProvider client={queryClient}>
        <ModeProvider>
          <RuntimeProvider runtime={runtime}>
            <InitProvider>{children}</InitProvider>
          </RuntimeProvider>
        </ModeProvider>
      </QueryClientProvider>
    </RegistryProvider>
  );
};

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <InnerProviders>{children}</InnerProviders>;
};
