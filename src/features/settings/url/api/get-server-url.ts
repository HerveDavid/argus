import { invoke } from '@tauri-apps/api/core';
import { ServerUrlResponse } from '../types/url.type';

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
