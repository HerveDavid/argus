import { invoke } from '@tauri-apps/api/core';
import {
  createServerUrlError,
  ServerUrlError,
  ServerUrlResponse,
} from '../types/url.type';
import { invokeTauri } from '@/utils/invoke-tauri';

/**
 * Gets the server URL from Tauri backend
 */
export const getServerUrlFromTauri = () =>
  invokeTauri<ServerUrlResponse, ServerUrlError>(
    'get_server_url',
    undefined,
    createServerUrlError,
  );

/**
 * Sets the server URL in Tauri backend
 */
export const setServerUrlInTauri = (url: string) =>
  invokeTauri<ServerUrlResponse, ServerUrlError>(
    'set_server_url',
    { server_url: url },
    createServerUrlError,
  );

/**
 * Sets the server URL in Tauri backend
 */
export const setServerUrl = async (url: string) => {
  try {
    // Call the Rust command
    const response = await invoke<ServerUrlResponse>('set_server_url', {
      server_url: url,
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to configure proxy: ${error}`);
  }
};
