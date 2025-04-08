import { invoke } from '@tauri-apps/api/core';
import { ServerUrlResponse } from '../types/url.type';

/**
 * Sets the server URL in Tauri backend
 */
export const getServerUrl = async () => {
  try {
    return await invoke<ServerUrlResponse>('get_server_url');
  } catch (error) {
    throw new Error(`Failed to get server_url: ${error}`);
  }
};

/**
 * Sets the server URL in Tauri backend
 */
export const setServerUrl = async (url: string) => {
  try {
    return await invoke<ServerUrlResponse>('set_server_url', {
      server_url: url,
    });
  } catch (error) {
    throw new Error(`Failed to set server_url: ${error}`);
  }
};
