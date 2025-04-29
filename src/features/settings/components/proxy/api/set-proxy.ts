import { invoke } from '@tauri-apps/api/core';
import { Proxy, ProxyResponse } from '../types/proxy.type';

/**
 * Sets the proxy configuration for the application
 * @param proxy The proxy configuration
 * @returns A promise that resolves to the proxy configuration response
 * @throws Error if the proxy configuration fails
 */
export async function setProxy(proxy: Proxy): Promise<ProxyResponse> {
  try {
    // Call the Rust command
    const response = await invoke<ProxyResponse>('plugin:settings|load_client', { proxy });

    return response;
  } catch (error) {
    throw new Error(`Failed to configure proxy: ${error}`);
  }
}
