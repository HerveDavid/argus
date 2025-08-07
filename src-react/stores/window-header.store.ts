import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

interface SelectedItemStore {
  title: string;
  setTitle: (title: string) => void;
}

export const useSelectedItemStore = create<SelectedItemStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      title: '',
      setTitle: (title) => set({ title }),
    })),
    { name: 'selected-item-store' },
  ),
);
