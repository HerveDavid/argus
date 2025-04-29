import { invoke } from '@tauri-apps/api/core';
import { ZmqUrlResponse } from '../types/zmq.type';

/**
 * Gets the ZeroMQ URL from the Tauri backend
 */
export const getZmqUrl = async (): Promise<ZmqUrlResponse> => {
  try {
    return await invoke<ZmqUrlResponse>('plugin:settings|get_zmq_url');
  } catch (error) {
    throw new Error(`Failed to get ZMQ URL: ${error}`);
  }
};

/**
 * Sets the ZeroMQ URL in the Tauri backend
 */
export const setZmqUrl = async (url: string): Promise<ZmqUrlResponse> => {
  try {
    return await invoke<ZmqUrlResponse>('plugin:settings|set_zmq_url', {
      zmq_url: url,
    });
  } catch (error) {
    throw new Error(`Failed to set ZMQ URL: ${error}`);
  }
};

/**
 * Sets a subscription for the ZeroMQ client
 */
export const setZmqSubscription = async (
  subscription: string,
): Promise<void> => {
  try {
    await invoke<void>('plugin:settings|set_zmq_subscription', {
      subscription,
    });
  } catch (error) {
    throw new Error(`Failed to set ZMQ subscription: ${error}`);
  }
};
