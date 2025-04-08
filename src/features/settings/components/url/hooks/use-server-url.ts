import { useStoreContext } from '@/features/settings/providers/store.provider';
import { getServerUrl, setServerUrl } from '../api';

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
  } = useStoreContext<ServerUrlData>(SERVER_URL_STORE_KEY);

  // Default values for when store data is undefined
  const url = serverUrlData?.url || '';
  const status = serverUrlData?.status || 'not_configured';

  /**
   * Fetches the server URL from Tauri and updates the store
   */
  const refreshServerUrl = async () => {
    try {
      const result = await getServerUrl();

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
  const setServer = async (newUrl: string) => {
    try {
      // Ensure newUrl is always a string
      const urlToSet = newUrl?.trim() || '';
      const result = await setServerUrl(urlToSet);

      // Update the store with the result
      await setStoreValue({
        url: result.url || '',
        status: result.url ? 'configured' : 'not_configured',
      });

      return result;
    } catch (err) {
      throw err;
    }
  };

  return {
    url,
    loading,
    error,
    status,
    setServerUrl: setServer,
    refreshServerUrl,
  };
};
