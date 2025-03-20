import { invoke } from '@tauri-apps/api/core';
import { ServerUrlResponse } from '../types/url.type';

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
 * Gets the current server URL configuration
 * @returns A promise that resolves to the server URL configuration response
 * @throws Error if retrieving the server URL configuration fails
 */
export async function getServerUrl(): Promise<ServerUrlResponse> {
  try {
    // Call the Rust command
    const response = await invoke<ServerUrlResponse>('get_server_url');
    return response;
  } catch (error) {
    throw new Error(`Failed to get server URL: ${error}`);
  }
}
