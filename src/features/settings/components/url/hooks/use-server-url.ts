import { Effect, pipe } from 'effect';
import {
  ServerUrlServiceTag,
  ServerUrlServiceLive,
} from '../services/server-url';
import { StoreServiceLive } from '@/utils/store-service';
import { ServerUrlError } from '../types/url.type';
import { useStoreContext } from '@/features/settings/providers/store.provider';

// Define the server URL data structure
export interface ServerUrlData {
  url: string;
  status: 'configured' | 'not_configured';
}

// Store key for the server URL
const SERVER_URL_STORE_KEY = 'server_url';

/**
 * Hook to manage server URL settings
 * @returns Object containing URL, status, and functions to manage the URL
 */
export const useServerUrl = () => {
  const {
    value: serverUrlData,
    loading,
    error,
    setValue: setStoreValue,
    refreshValue,
  } = useStoreContext<ServerUrlData>(SERVER_URL_STORE_KEY);

  // Default values for when store data is undefined
  const url = serverUrlData?.url || '';
  const status = serverUrlData?.status || 'not_configured';

  /**
   * Fetches the server URL from Tauri and updates the store
   */
  const refreshServerUrl = async () => {
    try {
      const program = pipe(
        Effect.flatMap(ServerUrlServiceTag, (service) =>
          service.getServerUrl(),
        ),
        Effect.provide(ServerUrlServiceLive),
        Effect.provide(StoreServiceLive),
      );

      const result = await Effect.runPromise(program);

      // Update the store with the result
      await setStoreValue({
        url: result.url || '',
        status: result.url ? 'configured' : 'not_configured',
      });
    } catch (err) {
      // The error will be captured by the store context
      console.error('Error refreshing server URL:', err);
      throw err;
    }
  };

  /**
   * Updates the server URL in Tauri and in the store
   */
  const setServerUrl = async (newUrl: string) => {
    try {
      // Ensure newUrl is always a string
      const urlToSet = newUrl?.trim() || '';

      const program = pipe(
        Effect.flatMap(ServerUrlServiceTag, (service) =>
          service.setServerUrl(urlToSet),
        ),
        Effect.provide(ServerUrlServiceLive),
        Effect.provide(StoreServiceLive),
      );

      const result = await Effect.runPromise(program);

      // Update the store with the result
      await setStoreValue({
        url: result.url || '',
        status: result.url ? 'configured' : 'not_configured',
      });

      return result;
    } catch (err) {
      const serverError = err as ServerUrlError;
      throw serverError;
    }
  };

  return {
    url,
    loading,
    error,
    status,
    setServerUrl,
    refreshServerUrl,
  };
};

/**
 * Function to load the server URL from Tauri
 * Can be used as a loader in StoreProvider
 */
export const loadServerUrl = async (): Promise<ServerUrlData> => {
  try {
    const program = pipe(
      Effect.flatMap(ServerUrlServiceTag, (service) => service.getServerUrl()),
      Effect.provide(ServerUrlServiceLive),
      Effect.provide(StoreServiceLive),
    );

    const result = await Effect.runPromise(program);

    return {
      url: result.url || '',
      status: result.url ? 'configured' : 'not_configured',
    };
  } catch (err) {
    console.error('Error loading server URL:', err);
    return {
      url: '',
      status: 'not_configured',
    };
  }
};
