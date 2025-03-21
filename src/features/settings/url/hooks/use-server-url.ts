import { useEffect } from 'react';
import { useServerUrlStore } from '../stores/server-url.store';

/**
 * Custom hook to manage server URL configuration
 * Wrapper around the Zustand store that handles initialization
 *
 * @returns Object with server URL state and functions to manage it
 */
export function useServerUrl() {
  const { url, status, loading, error, setServerUrl, refreshServerUrl } =
    useServerUrlStore();

  // Load server URL on initial mount
  useEffect(() => {
    refreshServerUrl();
  }, [refreshServerUrl]);

  return {
    url,
    status,
    loading,
    error,
    setServerUrl,
    refreshServerUrl,
  };
}
