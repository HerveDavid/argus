import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

interface GameMasterUrlResponse {
  url: string;
  message: string;
}

interface GameMasterStatus {
  url: string;
  is_default: boolean;
}

interface GameMasterError {
  message: string;
  code?: string;
}

interface GameMasterStore {
  url: string | null;
  isLoading: boolean;
  error: GameMasterError | null;

  setUrl: (url: string) => Promise<void>;
  getUrl: () => Promise<void>;
  clearError: () => void;
}

export const useGameMasterStore = create<GameMasterStore>()(
  devtools(
    (set) => ({
      url: null,
      isLoading: false,
      error: null,

      setUrl: async (url: string) => {
        console.log('Starting setUrl with:', url);
        set({ isLoading: true, error: null });

        try {
          console.log('Calling invoke with set_gamemaster_url...');
          const result = await invoke<GameMasterUrlResponse>(
            'set_gamemaster_url',
            {
              url: url.trim(),
            },
          );

          console.log('setUrl result:', result);

          set({
            isLoading: false,
            url: result.url,
            error: null,
          });
        } catch (error) {
          console.error('setUrl error:', error);

          const errorMessage =
            error instanceof Error ? error.message : String(error);

          set({
            isLoading: false,
            error: {
              message: errorMessage,
              code: 'SET_URL_ERROR',
            },
          });
        }
      },

      getUrl: async () => {
        console.log('Starting getUrl...');
        set({ isLoading: true, error: null });

        try {
          console.log('Calling invoke with get_gamemaster_url...');
          const result = await invoke<GameMasterStatus>('get_gamemaster_url');

          console.log('getUrl result:', result);

          set({
            isLoading: false,
            url: result.url,
            error: null,
          });
        } catch (error) {
          console.error('getUrl error:', error);

          const errorMessage =
            error instanceof Error ? error.message : String(error);

          set({
            isLoading: false,
            error: {
              message: errorMessage,
              code: 'GET_URL_ERROR',
            },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'gamemaster-store' },
  ),
);
