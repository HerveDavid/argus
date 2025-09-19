import { Channel, invoke } from '@tauri-apps/api/core';
import { Effect, HashMap, Ref } from 'effect';
import { EcsError } from './errors';
import { AppMode } from '@/types/mode';
import { DiagramEvent } from '@/types/diagram-event';

export class EcsClient extends Effect.Service<EcsClient>()(
  '@/common/EcsClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const channels = yield* Ref.make(
        HashMap.empty<string, Channel<DiagramEvent>>(),
      );
      return {
        // Config
        switch_mode: (mode: AppMode) =>
          Effect.tryPromise({
            try: () => invoke('switch_mode_ecs', { mode }),
            catch: (error) =>
              new EcsError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        // Powsybl
        add_subscription: ({
          elementId,
          channel,
        }: {
          elementId: string;
          channel: Channel<DiagramEvent>;
        }) =>
          Effect.tryPromise({
            try: () => {
              return invoke('add_subscription', {
                element_id: elementId,
                channel,
              });
            },
            catch: (error) =>
              new EcsError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),
        remove_subscription: ({ elementId }: { elementId: string }) =>
          Effect.tryPromise({
            try: () =>
              invoke('remove_subscription', {
                element_id: elementId,
              }),
            catch: (error) =>
              new EcsError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),
      } as const;
    }),
  },
) {}
