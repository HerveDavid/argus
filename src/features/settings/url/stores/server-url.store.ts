import { create } from 'zustand';
import { setServerUrl } from '../api/set-server-url';
import { getServerUrl } from '../api/get-server-url';

interface ServerUrlState {
  /** Current server URL value */
  url: string;
  /** Status of the server URL configuration */
  status: string;
  /** Whether a server operation is in progress */
  loading: boolean;
  /** Any error that occurred during server operations */
  error: string | null;
  /** Function to update URL state without making a Tauri call */
  setUrlState: (url: string, status?: string) => void;
  /** Function to set a new server URL via Tauri API */
  setServerUrl: (newUrl: string) => Promise<void>;
  /** Function to manually refresh the server URL */
  refreshServerUrl: () => Promise<void>;
}

export const useServerUrlStore = create<ServerUrlState>((set, get) => ({
  url: '',
  status: '',
  loading: false,
  error: null,

  /**
   * Set the URL value in the store without making a Tauri call
   * Useful for local state updates or testing
   */
  setUrlState: (url: string, status: string = 'configured') => {
    set({ url, status, loading: false, error: null });
  },

  setServerUrl: async (newUrl: string) => {
    try {
      set({ loading: true, error: null });

      const response = await setServerUrl(newUrl);

      set({
        url: response.url,
        status: response.status,
        loading: false,
      });
    } catch (err) {
      set({
        error: `Failed to configure server URL: ${err}`,
        loading: false,
      });

      // Refresh to ensure we have the current state
      await get().refreshServerUrl();
    }
  },

  refreshServerUrl: async () => {
    try {
      set({ loading: true, error: null });

      const response = await getServerUrl();

      set({
        url: response.url,
        status: response.status,
        loading: false,
      });
    } catch (err) {
      set({
        error: `Failed to get server URL: ${err}`,
        loading: false,
      });
    }
  },
}));
