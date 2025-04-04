import { StoreServiceTag } from '@/utils/store-service';
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

// Implémentation qui utilise le StoreService
export const makeServerUrlService = Effect.gen(function* (_) {
  // Accès au StoreService sous-jacent
  const store = yield* _(StoreServiceTag);

  // Création de l'implémentation
  const serviceImpl: ServerUrlService = {
    _tag: 'ServerUrlService',
    getServerUrl: () => getServerUrlFromTauri(),
    setServerUrl: (url: string) =>
      Effect.flatMap(setServerUrlInTauri(url), (response) => {
        // Transforme les erreurs possibles de store.set en ServerUrlError
        const setEffect = Effect.mapError(
          store.set(SERVER_URL_KEY, response.url),
          (error) =>
            createServerUrlError(
              `Store operation failed: ${error.message}`,
              error,
            ),
        );

        // Composition avec préservation du type original
        return Effect.flatMap(setEffect, () => Effect.succeed(response));
      }),
  };

  return serviceImpl;
});

// Layer qui dépend du StoreService
export const ServerUrlServiceLive = Layer.effect(
  ServerUrlServiceTag,
  makeServerUrlService,
);
