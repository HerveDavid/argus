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
            // Stocker le channel
            yield* Ref.update(channels, (map) =>
              HashMap.set(map, elementId, channel),
            );

            // Appeler directement invoke avec le channel fourni
            return yield* Effect.tryPromise({
              try: () =>
                invoke('add_subscription', {
                  element_id: elementId,
                  channel: channel, // Utiliser directement le channel fourni
                }),
              catch: (error) =>
                new EcsError({
                  message:
                    error instanceof Error ? error.message : String(error),
                }),
            });
          }),

        remove_subscription: ({ elementId }: { elementId: string }) =>
          Effect.gen(function* () {
            const channelMap = yield* Ref.get(channels);
            const maybeChannel = HashMap.get(channelMap, elementId);

            // ✅ Vérification correcte d'Option
            if (Option.isNone(maybeChannel)) {
              return yield* Effect.fail(
                new EcsError({
                  message: `No subscription found for element: ${elementId}`,
                }),
              );
            }

            // Supprimer de notre map locale
            yield* Ref.update(channels, (map) =>
              HashMap.remove(map, elementId),
            );

            // Appeler l'API Tauri
            return yield* Effect.tryPromise({
              try: () =>
                invoke('remove_subscription', { element_id: elementId }),
              catch: (error) =>
                new EcsError({
                  message:
                    error instanceof Error ? error.message : String(error),
                }),
            });
          }),

        // ✅ Nouvelle méthode pour récupérer un channel sans le supprimer
        get_subscription_channel: ({ elementId }: { elementId: string }) =>
          Effect.gen(function* () {
            const channelMap = yield* Ref.get(channels);
            const maybeChannel = HashMap.get(channelMap, elementId);

            if (Option.isNone(maybeChannel)) {
              return yield* Effect.fail(
                new EcsError({
                  message: `No subscription found for element: ${elementId}`,
                }),
              );
            }

            return maybeChannel.value;
          }),

        // ✅ Méthode pour lister tous les channels actifs
        list_active_subscriptions: () =>
          Effect.gen(function* () {
            const channelMap = yield* Ref.get(channels);
            return HashMap.keySet(channelMap);
          }),

        // ✅ Méthode pour vérifier si une subscription existe
        has_subscription: ({ elementId }: { elementId: string }) =>
          Effect.gen(function* () {
            const channelMap = yield* Ref.get(channels);
            const maybeChannel = HashMap.get(channelMap, elementId);
            return Option.isSome(maybeChannel);
          }),
      } as const;
    }),
  },
) {}
