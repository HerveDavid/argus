import { useState, useEffect } from 'react';
import { Effect, pipe } from 'effect';
import {
  ServerUrlServiceTag,
  ServerUrlServiceLive,
} from '../utils/server-url.service';
import { StoreServiceLive } from '@/utils/store-service';
import { ServerUrlError } from '../types/url.type';

/**
 * Hook pour gérer les paramètres avec SettingsStore
 * @param key - Clé unique pour identifier les paramètres
 * @param defaultValue - Valeur par défaut si aucun paramètre n'est trouvé
 * @returns [settings, setSettings, isLoading, error]
 */
/**
 * Hook pour gérer les paramètres du serveur URL
 * @returns {Object} Objet contenant URL, statut, et fonctions pour gérer l'URL
 */
export const useServerUrl = () => {
  // Change the type to string with empty string as default
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'configured' | 'not_configured'>(
    'not_configured',
  );

  // Function to fetch the server URL
  const refreshServerUrl = async () => {
    setLoading(true);
    setError(null);

    const program = pipe(
      Effect.flatMap(ServerUrlServiceTag, (service) => service.getServerUrl()),
      Effect.provide(ServerUrlServiceLive),
      Effect.provide(StoreServiceLive),
    );

    try {
      const result = await Effect.runPromise(program);
      // Ensure we always set a string, not null
      setUrl(result.url || '');
      setStatus(result.url ? 'configured' : 'not_configured');
    } catch (err) {
      const serverError = err as ServerUrlError;
      setError(serverError.message || 'Failed to fetch server URL');
      setStatus('not_configured');
    } finally {
      setLoading(false);
    }
  };

  // Function to update the server URL
  const setServerUrl = async (newUrl: string) => {
    setLoading(true);
    setError(null);

    // Ensure newUrl is always a string
    const urlToSet = newUrl?.trim() || '';

    const program = pipe(
      Effect.flatMap(ServerUrlServiceTag, (service) =>
        service.setServerUrl(urlToSet),
      ),
      Effect.provide(ServerUrlServiceLive),
      Effect.provide(StoreServiceLive),
    );

    try {
      const result = await Effect.runPromise(program);
      // Ensure we always set a string, not null
      setUrl(result.url || '');
      setStatus(result.url ? 'configured' : 'not_configured');
      return result;
    } catch (err) {
      const serverError = err as ServerUrlError;
      setError(serverError.message || 'Failed to update server URL');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load the URL when the component mounts
  useEffect(() => {
    refreshServerUrl();
  }, []);

  return {
    url,
    loading,
    error,
    status,
    setServerUrl,
    refreshServerUrl,
  };
};
