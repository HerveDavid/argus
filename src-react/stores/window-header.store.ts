import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

interface WindowHeaderStore {
  title: string;
  setTitle: (title: string) => void;
}

export const useWindowHeaderStore = create<WindowHeaderStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      title: '',
      setTitle: (title) => set({ title }),
    })),
    { name: 'window-header-store' },
  ),
);
