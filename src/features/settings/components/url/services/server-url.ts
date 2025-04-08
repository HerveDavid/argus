import { StoreServiceTag } from '@/features/settings/services/store-service';
import { Effect, Context, Layer } from 'effect';
import {
  createServerUrlError,
  ServerUrlError,
  ServerUrlResponse,
} from '../types/url.type';
import { getServerUrlFromTauri, setServerUrlInTauri } from '../api';

// -------------- SERVER URL SERVICE ---------------
// Interface for managing the ServerURL
export interface ServerUrlService {
  readonly _tag: 'ServerUrlService';
  /**
   * Gets the current server URL from Tauri backend
   */
  readonly getServerUrl: () => Effect.Effect<
    ServerUrlResponse,
    ServerUrlError,
    never
  >;
  /**
   * Sets the server URL in Tauri backend
   */
  readonly setServerUrl: (
    url: string,
  ) => Effect.Effect<ServerUrlResponse, ServerUrlError, never>;
}

// Storage key for the server URL in the local cache
const SERVER_URL_KEY = 'server_url';

// Context Tag for the ServerUrlService
export class ServerUrlServiceTag extends Context.Tag('ServerUrlService')<
  ServerUrlServiceTag,
  ServerUrlService
>() {}

// Implementation that uses the StoreService
export const makeServerUrlService = Effect.gen(function* (_) {
  // Access to the underlying StoreService
  const store = yield* _(StoreServiceTag);

  // Create the implementation
  const serviceImpl: ServerUrlService = {
    _tag: 'ServerUrlService',
    getServerUrl: () => {
      // Get from store first
      return Effect.flatMap(
        Effect.mapError(store.get<string>(SERVER_URL_KEY), (error) =>
          createServerUrlError(
            `Store operation failed: ${error.message}`,
            error,
          ),
        ),
        (urlFromStore) => {
          // If we got a value from the store
          if (urlFromStore) {
            // Set the value to Tauri backend
            return Effect.flatMap(
              setServerUrlInTauri(urlFromStore),
              (response) => Effect.succeed(response),
            );
          }
          // If no value in store, get from Tauri
          return getServerUrlFromTauri();
        },
      );
    },
    setServerUrl: (url: string) =>
      Effect.flatMap(setServerUrlInTauri(url), (response) => {
        // Transform possible errors from store.set into ServerUrlError
        const setEffect = Effect.mapError(
          store.set(SERVER_URL_KEY, response.url),
          (error) =>
            createServerUrlError(
              `Store operation failed: ${error.message}`,
              error,
            ),
        );
        // Composition with preservation of the original type
        return Effect.flatMap(setEffect, () => Effect.succeed(response));
      }),
  };

  return serviceImpl;
});

// Layer that depends on StoreService
export const ServerUrlServiceLive = Layer.effect(
  ServerUrlServiceTag,
  makeServerUrlService,
);
