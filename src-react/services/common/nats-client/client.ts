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
            yield* Effect.log(`Setting NATS address: ${address}`);

            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<NatsAddressResponse>('set_nats_address', { address }),
              catch: (error) => {
                const errorMsg =
                  error instanceof Error ? error.message : String(error);
                return new NatsAddressError({
                  address,
                  cause: errorMsg,
                });
              },
            });

            yield* Effect.log(`Successfully set NATS address`);

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

            yield* Effect.log(`Address saved to settings`);
            return response;
          }),

        connect: (): Effect.Effect<NatsConnectionResponse, NatsError> =>
          Effect.gen(function* () {
            yield* Effect.log(`Attempting NATS connection`);

            const response = yield* Effect.tryPromise({
              try: () => invoke<NatsConnectionResponse>('connect_nats'),
              catch: (error) => {
                const errorMsg =
                  error instanceof Error ? error.message : String(error);
                return new NatsConnectionError({
                  cause: errorMsg,
                });
              },
            });

            yield* Effect.log(`NATS connection successful`);
            return response;
          }),

        disconnect: (): Effect.Effect<NatsDisconnectionResponse, NatsError> =>
          Effect.gen(function* () {
            yield* Effect.log(`Disconnecting from NATS`);

            const response = yield* Effect.tryPromise({
              try: () => invoke<NatsDisconnectionResponse>('disconnect_nats'),
              catch: (error) => {
                const errorMsg =
                  error instanceof Error ? error.message : String(error);
                return new NatsDisconnectionError({
                  cause: errorMsg,
                });
              },
            });

            yield* Effect.log(`NATS disconnection successful`);
            return response;
          }),

        getConnectionStatus: (): Effect.Effect<
          NatsConnectionStatus,
          NatsError
        > =>
          Effect.gen(function* () {
            yield* Effect.log(`Getting NATS connection status`);

            const response = yield* Effect.tryPromise({
              try: () =>
                invoke<NatsConnectionStatus>('get_nats_connection_status'),
              catch: (error) => {
                const errorMsg =
                  error instanceof Error ? error.message : String(error);
                return new NatsStatusError({
                  cause: errorMsg,
                });
              },
            });

            yield* Effect.log(`NATS status retrieved successfully`);
            return response;
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
            yield* Effect.log(`Connecting to saved NATS address`);

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

            yield* Effect.log(`Found saved address: ${savedAddress}`);

            // Définir l'adresse
            yield* Effect.tryPromise({
              try: () =>
                invoke<NatsAddressResponse>('set_nats_address', {
                  address: savedAddress,
                }),
              catch: (error) => {
                const errorMsg =
                  error instanceof Error ? error.message : String(error);
                return new NatsAddressError({
                  address: savedAddress,
                  cause: errorMsg,
                });
              },
            });

            // Se connecter
            const response = yield* Effect.tryPromise({
              try: () => invoke<NatsConnectionResponse>('connect_nats'),
              catch: (error) => {
                const errorMsg =
                  error instanceof Error ? error.message : String(error);
                return new NatsConnectionError({
                  cause: errorMsg,
                });
              },
            });

            yield* Effect.log(`Successfully connected to saved address`);
            return response;
          }),
      } satisfies NatsService;
    }),
  },
) {}
