import { invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import { Channel } from '@tauri-apps/api/core';
import { FeederActionResponse, FeederStatus } from './types';
import { FeederOperationError } from './errors';

export interface FeederService {
  readonly addNatsFeeder: (
    feederId: string,
    channel: Channel<any>,
  ) => Effect.Effect<FeederActionResponse, FeederOperationError>;
}

export class FeederClient extends Effect.Service<FeederClient>()(
  '@/feeders/FeederClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      // Cache local pour les feeders ajoutés
      const feederStatusCacheRef = yield* Ref.make<
        Map<string, { status: FeederStatus; timestamp: number }>
      >(new Map());

      const CACHE_TTL = 5000; // 5 secondes de cache

      const setCachedStatus = (feederId: string, status: FeederStatus) =>
        Effect.gen(function* () {
          const cache = yield* Ref.get(feederStatusCacheRef);
          const newCache = new Map(cache);
          newCache.set(feederId, { status, timestamp: Date.now() });
          yield* Ref.set(feederStatusCacheRef, newCache);
        });

      return {
        addNatsFeeder: (feederId: string, channel: Channel<any>) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Adding NATS feeder ${feederId}`);

            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<FeederActionResponse>('add_nats_feeder', {
                  id: feederId,
                  channel,
                }),
              catch: (error) =>
                new FeederOperationError('AddNats', feederId, error),
            });

            if (response.feeder_status) {
              yield* setCachedStatus(feederId, response.feeder_status);
            }

            yield* Effect.logInfo(
              `NATS feeder ${feederId} added: ${response.message}`,
            );
            return response;
          }),
      } as FeederService;
    }),
  },
) {}
