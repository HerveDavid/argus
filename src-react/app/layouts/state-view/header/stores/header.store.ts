import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export interface HeaderStore {
  isOpen: boolean;

  setOpen: (isOpen: boolean) => void;
}

export const useHeaderStore = create<HeaderStore>()(
  devtools(
    subscribeWithSelector((set, _get) => ({
      isOpen: false,
      setOpen: (isOpen: boolean) => {
        set({ isOpen: isOpen });
      },
    })),
    { name: 'header-store' },
  ),
);
