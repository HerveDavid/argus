import { useStoreContext } from '@/features/settings/providers/store.provider';
import { getZmqUrl, setZmqUrl, setZmqSubscription } from '../api';

// Define the ZMQ URL data structure
export interface ZmqUrlData {
  url: string;
  subscription: string;
  status: 'configured' | 'not_configured';
}

// Store key for the ZMQ URL
const ZMQ_URL_STORE_KEY = 'zmq_url';

/**
 * Hook to manage ZMQ URL settings
 * @returns Object containing URL, subscription, status, and functions to manage the ZMQ connection
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
  const subscription = zmqUrlData?.subscription || '';
  const status = zmqUrlData?.status || 'not_configured';

  /**
   * Fetches the ZMQ URL from Tauri and updates the store
   */
  const refreshZmqUrl = async () => {
    try {
      const result = await getZmqUrl();
      // Update the store with the result
      await setStoreValue({
        url: result.url || '',
        subscription: result.subscription || '',
        status: result.url ? 'configured' : 'not_configured',
      });
      return result;
    } catch (err) {
      // The error will be captured by the store context
      console.error('Error refreshing ZMQ URL:', err);
      throw err;
    }
  };

  /**
   * Updates the ZMQ URL in Tauri and in the store
   */
  const setZmq = async (newUrl: string) => {
    try {
      // Ensure newUrl is always a string
      const urlToSet = newUrl?.trim() || '';
      const result = await setZmqUrl(urlToSet);

      // Update the store with the result, ensuring values are never undefined
      await setStoreValue({
        url: result.url || '',
        subscription: zmqUrlData?.subscription || '',
        status: result.url ? 'configured' : 'not_configured',
      });

      return result;
    } catch (err) {
      console.error('Error setting ZMQ URL:', err);
      throw err;
    }
  };

  /**
   * Updates the ZMQ subscription in Tauri and in the store
   */
  const setSubscription = async (newSubscription: string) => {
    try {
      // Check if URL is configured before setting subscription
      if (!url) {
        throw new Error(
          'ZMQ URL must be configured before setting a subscription',
        );
      }

      // Ensure subscription is always a string
      const subscriptionToSet = newSubscription?.trim() || '';
      await setZmqSubscription(subscriptionToSet);

      // Update the store with the new subscription
      await setStoreValue({
        url: zmqUrlData?.url || '',
        subscription: subscriptionToSet,
        status: zmqUrlData?.status || 'not_configured',
      });

      return { subscription: subscriptionToSet };
    } catch (err) {
      console.error('Error setting ZMQ subscription:', err);
      throw err;
    }
  };

  /**
   * Updates both ZMQ URL and subscription in a single operation
   * This helps avoid the error when trying to set subscription with no URL
   */
  const setZmqConfig = async (newUrl: string, newSubscription: string = '') => {
    try {
      // First set the URL
      const urlToSet = newUrl?.trim() || '';
      const result = await setZmqUrl(urlToSet);

      // Only attempt to set subscription if URL was successfully set
      if (result.url) {
        try {
          // Set the subscription
          const subscriptionToSet = newSubscription?.trim() || '';
          await setZmqSubscription(subscriptionToSet);

          // Update the store with both new values
          await setStoreValue({
            url: result.url,
            subscription: subscriptionToSet,
            status: 'configured',
          });

          return {
            url: result.url,
            subscription: subscriptionToSet,
            status: 'configured',
          };
        } catch (subErr) {
          // If subscription fails, still update the URL in the store
          console.error('Error setting ZMQ subscription:', subErr);
          await setStoreValue({
            url: result.url,
            subscription: '',
            status: 'configured',
          });

          return {
            url: result.url,
            subscription: '',
            status: 'configured',
            subscriptionError: String(subErr),
          };
        }
      } else {
        // If URL wasn't set properly, update store with empty values
        await setStoreValue({
          url: '',
          subscription: '',
          status: 'not_configured',
        });

        return {
          url: '',
          subscription: '',
          status: 'not_configured',
        };
      }
    } catch (err) {
      console.error('Error setting ZMQ configuration:', err);
      throw err;
    }
  };

  return {
    url,
    subscription,
    loading,
    error,
    status,
    setZmqUrl: setZmq,
    setZmqSubscription: setSubscription,
    setZmqConfig,
    refreshZmqUrl,
  };
};
