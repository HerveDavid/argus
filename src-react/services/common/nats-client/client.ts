import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';
import {
  NatsConnectionStatus,
  NatsAddressResponse,
  NatsConnectionResponse,
  NatsDisconnectionResponse,
} from './types';
import {
  NatsError,
  NatsConnectionError,
  NatsDisconnectionError,
  NatsAddressError,
  NatsStatusError,
} from './error';
import { SettingsClient } from '@/services/common/settings-client';

const NATS_ADDRESS_SETTING_KEY = 'nats-address';

interface NatsService {
  readonly setAddress: (
    address: string,
  ) => Effect.Effect<NatsAddressResponse, NatsError>;
  readonly connect: () => Effect.Effect<NatsConnectionResponse, NatsError>;
  readonly disconnect: () => Effect.Effect<
    NatsDisconnectionResponse,
    NatsError
  >;
  readonly getConnectionStatus: () => Effect.Effect<
    NatsConnectionStatus,
    NatsError
  >;
  readonly getSavedAddress: () => Effect.Effect<string | null, NatsError>;
  readonly connectToSavedAddress: () => Effect.Effect<
    NatsConnectionResponse,
    NatsError
  >;
}

export class NatsClient extends Effect.Service<NatsClient>()(
  '@/services/nats/NatsClient',
  {
    effect: Effect.gen(function* () {
      const settingsClient = yield* SettingsClient;

      return {
        setAddress: (
          address: string,
        ): Effect.Effect<NatsAddressResponse, NatsError> =>
          Effect.gen(function* () {
            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<NatsAddressResponse>('set_nats_address', { address }),
              catch: (error) =>
                new NatsAddressError({
                  address,
                  cause:
                    error instanceof Error ? error.message : 'Unknown error',
                }),
            });

            yield* settingsClient
              .setStringSetting(NATS_ADDRESS_SETTING_KEY, address)
              .pipe(
                Effect.mapError(
                  (settingError) =>
                    new NatsAddressError({
                      address,
                      cause: `Failed to save address to settings: ${settingError.message}`,
                    }),
                ),
              );

            return response;
          }),

        connect: (): Effect.Effect<NatsConnectionResponse, NatsError> =>
          Effect.tryPromise({
            try: () => invoke<NatsConnectionResponse>('connect_nats'),
            catch: (error) =>
              new NatsConnectionError({
                cause:
                  error instanceof Error
                    ? error.message
                    : 'Failed to connect to NATS',
              }),
          }),

        disconnect: (): Effect.Effect<NatsDisconnectionResponse, NatsError> =>
          Effect.tryPromise({
            try: () => invoke<NatsDisconnectionResponse>('disconnect_nats'),
            catch: (error) =>
              new NatsDisconnectionError({
                cause:
                  error instanceof Error
                    ? error.message
                    : 'Failed to disconnect from NATS',
              }),
          }),

        getConnectionStatus: (): Effect.Effect<
          NatsConnectionStatus,
          NatsError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<NatsConnectionStatus>('get_nats_connection_status'),
            catch: (error) =>
              new NatsStatusError({
                cause:
                  error instanceof Error
                    ? error.message
                    : 'Failed to get connection status',
              }),
          }),

        getSavedAddress: (): Effect.Effect<string | null, NatsError> =>
          settingsClient
            .getStringSetting(NATS_ADDRESS_SETTING_KEY)
            .pipe(Effect.catchAll(() => Effect.succeed(null))),

        connectToSavedAddress: (): Effect.Effect<
          NatsConnectionResponse,
          NatsError
        > =>
          Effect.gen(function* () {
            // Récupérer l'adresse sauvegardée
            const savedAddress = yield* settingsClient
              .getStringSetting(NATS_ADDRESS_SETTING_KEY)
              .pipe(
                Effect.mapError(
                  (settingError) =>
                    new NatsConnectionError({
                      cause: `Failed to retrieve saved address: ${settingError.message}`,
                    }),
                ),
                Effect.catchTag('NatsConnectionError', () =>
                  Effect.fail(
                    new NatsConnectionError({
                      cause:
                        'No saved NATS address found. Please set an address first.',
                    }),
                  ),
                ),
              );

            yield* Effect.tryPromise({
              try: () =>
                invoke<NatsAddressResponse>('set_nats_address', {
                  address: savedAddress,
                }),
              catch: (error) =>
                new NatsAddressError({
                  address: savedAddress,
                  cause:
                    error instanceof Error ? error.message : 'Unknown error',
                }),
            });

            return yield* Effect.tryPromise({
              try: () => invoke<NatsConnectionResponse>('connect_nats'),
              catch: (error) =>
                new NatsConnectionError({
                  cause:
                    error instanceof Error
                      ? error.message
                      : 'Failed to connect to NATS',
                }),
            });
          }),
      } satisfies NatsService;
    }),
  },
) {}
