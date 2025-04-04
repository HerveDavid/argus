import { invoke } from '@tauri-apps/api/core';
import {
  createServerUrlError,
  ServerUrlError,
  ServerUrlResponse,
} from '../types/url.type';
import { invokeTauri } from '@/lib/invoke-tauri';

/**
 * Sets the server URL configuration for the application
 * @param url The server URL to configure
 * @returns A promise that resolves to the server URL configuration response
 * @throws Error if the server URL configuration fails
 */
export async function setServerUrl(url: string): Promise<ServerUrlResponse> {
  try {
    // Call the Rust command
    const response = await invoke<ServerUrlResponse>('set_server_url', {
      server_url: url,
    });
    return response;
  } catch (error) {
    throw new Error(`Failed to configure server URL: ${error}`);
  }
}

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
