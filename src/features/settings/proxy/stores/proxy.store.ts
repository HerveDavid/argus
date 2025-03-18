import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Import the setProxy function we created earlier
import { setProxy } from '../api/set-proxy'; // Adjust the path according to your structure
import { Proxy, ProxyResponse } from '../types/proxy.type';

// Store interface
interface ProxyStore {
  proxy: Proxy;
  isLoading: boolean;
  error: string | null;
  // Basic store actions
  setProxy: (proxy: Proxy) => void;
  updateProxy: (partialProxy: Partial<Proxy>) => void;
  resetProxy: () => void;
  // Action to apply configuration to the backend
  applyProxy: () => Promise<ProxyResponse>;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

const defaultProxy: Proxy = {
  no_proxy: '',
  url: '',
};

export const useProxyStore = create<ProxyStore>()(
  persist(
    (set, get) => ({
      proxy: defaultProxy,
      isLoading: false,
      error: null,
      // Basic actions to manage local state
      setProxy: (proxy: Proxy) => set({ proxy }),
      updateProxy: (partialProxy: Partial<Proxy>) =>
        set((state) => ({
          proxy: { ...state.proxy, ...partialProxy },
        })),
      resetProxy: () => set({ proxy: defaultProxy }),
      // Actions to manage loading and errors
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      // Action to apply configuration to the backend
      // Uses the setProxy function created earlier
      applyProxy: async () => {
        const state = get();
        // Mark as loading
        set({ isLoading: true, error: null });
        try {
          // Use the setProxy function
          const response = await setProxy(state.proxy);
          // Mark as completed
          set({ isLoading: false });
          return response;
        } catch (error) {
          // Handle error
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },
    }),
    {
      name: 'proxy-storage',
    },
  ),
);

// Utility functions to access the store from anywhere
export const getProxy = () => useProxyStore.getState().proxy;
export const getProxyUsername = () => useProxyStore.getState().proxy.username;
export const getProxyPassword = () => useProxyStore.getState().proxy.password;
export const getProxyUrl = () => useProxyStore.getState().proxy.url;
export const getNoProxy = () => useProxyStore.getState().proxy.no_proxy;
export const applyProxy = () => useProxyStore.getState().applyProxy();
