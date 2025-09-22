import { Channel, invoke } from '@tauri-apps/api/core';
import { Effect, HashMap, Option, Ref } from 'effect';
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
          Effect.gen(function* () {
            yield* Ref.update(channels, (map) =>
              HashMap.set(map, elementId, channel),
            );

            return yield* Ref.get(channels).pipe(
              Effect.flatMap((channelMap) => {
                const maybeStoredChannel = HashMap.get(channelMap, elementId);

                // Vérification explicite de l'Option
                if (Option.isNone(maybeStoredChannel)) {
                  return Effect.fail(
                    new EcsError({
                      message: `Channel not found for element: ${elementId}`,
                    }),
                  );
                }

                const storedChannel = maybeStoredChannel.value;

                return Effect.tryPromise({
                  try: () =>
                    invoke('add_subscription', {
                      element_id: elementId,
                      channel: storedChannel,
                    }),
                  catch: (error) =>
                    new EcsError({
                      message:
                        error instanceof Error ? error.message : String(error),
                    }),
                });
              }),
            );
          }),
        // add_subscription: ({
        //   elementId,
        //   channel,
        // }: {
        //   elementId: string;
        //   channel: Channel<DiagramEvent>;
        // }) => {

        //   Effect.gen(function* () {
        //     yield* Ref.update(channels, (map) => HashMap.set(map, elementId, channel))
        //   })

        //   return Effect.tryPromise({
        //     try: () => {
        //       return invoke('add_subscription', {
        //         element_id: elementId,
        //         channel,
        //       });
        //     },
        //     catch: (error) =>
        //       new EcsError({
        //         message: error instanceof Error ? error.message : String(error),
        //       }),
        //   })
        // },
        remove_subscription: ({ elementId }: { elementId: string }) =>
          Ref.get(channels).pipe(
            Effect.flatMap((channelMap) => {
              const channelExists = HashMap.get(channelMap, elementId);

              if (!channelExists) {
                return Effect.fail(
                  new EcsError({
                    message: `No subscription found for element: ${elementId}`,
                  }),
                );
              }

              return Effect.gen(function* () {
                yield* Ref.update(channels, (map) =>
                  HashMap.remove(map, elementId),
                );
                yield* Effect.tryPromise({
                  try: () =>
                    invoke('remove_subscription', { element_id: elementId }),
                  catch: (error) =>
                    new EcsError({
                      message:
                        error instanceof Error ? error.message : String(error),
                    }),
                });
              });
            }),
          ),
        // remove_subscription: ({ elementId }: { elementId: string }) =>
        //   Effect.tryPromise({
        //     try: () =>
        //       invoke('remove_subscription', {
        //         element_id: elementId,
        //       }),
        //     catch: (error) =>
        //       new EcsError({
        //         message: error instanceof Error ? error.message : String(error),
        //       }),
        //   }),
      } as const;
    }),
  },
) {}
