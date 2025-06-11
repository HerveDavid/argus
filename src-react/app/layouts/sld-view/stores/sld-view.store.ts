import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { rightSidebarSlds } from '@/config/layouts';
import { SidebarItem } from '@/types/sidebar-item';

interface SidebarStore {
  isOpen: boolean;
  activeItem: SidebarItem;
  size: number;
  closePanel: () => void;
  openPanel: () => void;
  setActiveItem: (panelId: string) => void;
  setSize: (size: number) => void;
}

const createStore = (id: string) =>
  create<SidebarStore>()(
    devtools(
      subscribeWithSelector((set) => ({
        isOpen: false,
        activeItem: rightSidebarSlds[0],
        size: 15,
        closePanel: () => set({ isOpen: false }),
        openPanel: () => set({ isOpen: true }),
        setActiveItem: (panelId) => {
          const activeItem = rightSidebarSlds.find(
            (item) => item.id === panelId,
          );
          if (activeItem) {
            set({ activeItem });
          } else {
            throw new Error(`Panel ${panelId} not found`);
          }
        },
        setSize: (size) => set({ size }),
      })),
      { name: `right-sidebar-slds-store-${id}` },
    ),
  );

const storeCache = new Map<string, ReturnType<typeof createStore>>();

export const createRightSidebarSldsStore = (id: string) => {
  if (storeCache.has(id)) {
    return storeCache.get(id)!;
  }

  const store = createStore(id);
  storeCache.set(id, store);
  return store;
};
