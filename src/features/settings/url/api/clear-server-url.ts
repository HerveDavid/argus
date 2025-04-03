import { invoke } from '@tauri-apps/api/core';
import { ServerUrlResponse } from '../types/url.type';

/**
 * Clears the server URL configuration
 * @returns A promise that resolves to the server URL configuration response
 * @throws Error if clearing the server URL configuration fails
 */
export async function clearServerUrl(): Promise<ServerUrlResponse> {
  try {
    // Call the Rust command
    const response = await invoke<ServerUrlResponse>('clear_server_url');
    return response;
  } catch (error) {
    throw new Error(`Failed to clear server URL: ${error}`);
  }
}
