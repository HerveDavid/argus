import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Proxy } from '../types/proxy.type';

interface ProxyStore {
  proxy: Proxy;

  setProxy: (proxy: Proxy) => void;
  updateProxy: (partialProxy: Partial<Proxy>) => void;
  resetProxy: () => void;
}

const defaultProxy: Proxy = {
  username: '',
  password: '',
  noProxy: '',
  url: '',
};

export const useProxyStore = create<ProxyStore>()(
  persist(
    (set) => ({
      proxy: defaultProxy,

      setProxy: (proxy: Proxy) => set({ proxy }),

      updateProxy: (partialProxy: Partial<Proxy>) =>
        set((state) => ({
          proxy: { ...state.proxy, ...partialProxy },
        })),

      resetProxy: () => set({ proxy: defaultProxy }),
    }),
    {
      name: 'proxy-storage',
    },
  ),
);

export const getProxy = () => useProxyStore.getState().proxy;
export const getProxyUsername = () => useProxyStore.getState().proxy.username;
export const getProxyPassword = () => useProxyStore.getState().proxy.password;
export const getProxyUrl = () => useProxyStore.getState().proxy.url;
export const getNoProxy = () => useProxyStore.getState().proxy.noProxy;
