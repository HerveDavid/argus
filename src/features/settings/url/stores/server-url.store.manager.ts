import { LazyStore } from '@tauri-apps/plugin-store';
import { ServerUrlResponse } from '../types/url.type';

/**
 * Manager class for server URL persistance using Tauri's LazyStore
 * Implements the Singleton pattern to ensure only one instance exists
 */
class ServerUrlStoreManager {
  private static instance: ServerUrlStoreManager;
  private store: LazyStore;

  private constructor() {
    this.store = new LazyStore('server-url-store.json', { autoSave: true });
  }

  /**
   * Get the singleton instance of the store manager
   * @returns The ServerUrlStoreManager instance
   */
  public static getInstance(): ServerUrlStoreManager {
    if (!ServerUrlStoreManager.instance) {
      ServerUrlStoreManager.instance = new ServerUrlStoreManager();
    }
    return ServerUrlStoreManager.instance;
  }

  /**
   * Save the server URL configuration to the store
   * @param url URL string to save
   * @param status Status of the configuration
   * @returns Promise that resolves when the save is complete
   */
  async setServerUrl(
    url: string,
    status: string = 'configured',
  ): Promise<void> {
    await this.store.set('serverUrl', { url, status });
    await this.store.save();
  }

  /**
   * Retrieve the server URL configuration from the store
   * @returns Promise that resolves to the server URL response or null if not found
   */
  async getServerUrl(): Promise<ServerUrlResponse | null> {
    const data = await this.store.get('serverUrl');
    if (!data) return null;

    const { url, status } = data as { url: string; status: string };
    return {
      url,
      status,
    };
  }

  /**
   * Clear the server URL configuration from the store
   * @returns Promise that resolves when the clear operation is complete
   */
  async clearServerUrl(): Promise<void> {
    await this.store.delete('serverUrl');
    await this.store.save();
  }
}

// Export the singleton instance
export const serverUrlStore = ServerUrlStoreManager.getInstance();
