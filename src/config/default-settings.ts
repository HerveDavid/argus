import { setServerUrl } from '@/features/settings/components/url/api';
import {
  setZmqSubscription,
  setZmqUrl,
} from '@/features/settings/components/zmq/api';

// Handler for server URL configuration
const handleServerConfig = async (serverConfig: { url: string }) => {
  try {
    const { url } = serverConfig;
    await setServerUrl(url);
  } catch (err) {
    console.error('Error in server config handler:', err);
    throw err;
  }
};

/**
 * Handler for ZMQ URL and subscription configuration
 * This handler will be triggered when the ZMQ store values change
 */
const handleZmqConfig = async (zmqConfig: {
  url: string;
  subscription: string;
  status: 'configured' | 'not_configured';
}) => {
  try {
    const { url, subscription } = zmqConfig;

    // Only set the ZMQ URL if it has been modified
    if (url) {
      await setZmqUrl(url);
    }

    // Only set the subscription if it has been provided
    if (subscription) {
      await setZmqSubscription(subscription);
    }
  } catch (err) {
    console.error('Error in ZMQ config handler:', err);
    throw err;
  }
};

export const defaultSettings = [
  {
    key: 'server_url',
    defaultValue: {
      url: '',
      status: 'not_configured',
    },
    handler: handleServerConfig,
  },
  {
    key: 'zmq_url',
    defaultValue: {
      url: 'tcp://127.0.0.1:5556',
      subscription: '',
      status: 'configured',
    },
    handler: handleZmqConfig,
  },
  {
    key: 'preferences',
    defaultValue: {
      theme: 'light',
    },
  },
];
