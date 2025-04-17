import { useStoreContext } from '@/features/settings/providers/store.provider';
import { getZmqUrl, setZmqUrl, setZmqSubscription } from '../api';

// Define the ZMQ URL data structure
export interface ZmqUrlData {
  url: string;
  status: 'configured' | 'not_configured';
}

// Store key for the ZMQ URL
const ZMQ_URL_STORE_KEY = 'zmq_url';

/**
 * Hook to manage ZeroMQ URL settings
 * @returns Object containing URL, status, and functions to manage the URL
 */
export const useZmqUrl = () => {
  const {
    value: zmqUrlData,
    loading,
    error,
    setValue: setStoreValue,
  } = useStoreContext<ZmqUrlData>(ZMQ_URL_STORE_KEY);

  // Default values for when store data is undefined
  const url = zmqUrlData?.url || '';
  const status = zmqUrlData?.status || 'not_configured';

  /**
   * Fetches the ZeroMQ URL from Tauri and updates the store
   */
  const refreshZmqUrl = async () => {
    try {
      const result = await getZmqUrl();
      // Update the store with the result
      await setStoreValue({
        url: result.url || '',
        status: result.url ? 'configured' : 'not_configured',
      });
    } catch (err) {
      // The error will be captured by the store context
      console.error('Error refreshing ZMQ URL:', err);
      throw err;
    }
  };

  /**
   * Updates the ZeroMQ URL in Tauri and in the store
   */
  const setZmq = async (newUrl: string) => {
    try {
      // Ensure newUrl is always a string
      const urlToSet = newUrl?.trim() || '';
      const result = await setZmqUrl(urlToSet);
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

  /**
   * Sets a subscription for the ZeroMQ client
   */
  const setSubscription = async (subscription: string) => {
    try {
      await setZmqSubscription(subscription);
    } catch (err) {
      console.error('Error setting ZMQ subscription:', err);
      throw err;
    }
  };

  return {
    url,
    loading,
    error,
    status,
    setZmqUrl: setZmq,
    refreshZmqUrl,
    setSubscription,
  };
};
