import * as Effect from 'effect/Effect';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import {
  leftSidebarPanels,
  leftSidebarTools,
  rightSidebarPanels,
} from '@/config/layouts';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { SettingsClient } from '@/services/common/settings-client';
import { LiveManagedRuntime } from '@/services/live-layer';
import { SidebarItem } from '@/types/sidebar-item';

interface SidebarConfig {
  name: string;
  panels: SidebarItem[];
  defaultSize?: number;
}

export interface SidebarStore {
  isOpen: boolean;
  activeItem: SidebarItem;
  size: number;
  runtime: LiveManagedRuntime | null;
  closePanel: () => void;
  openPanel: () => void;
  setActiveItem: (panelId: string) => void;
  setSize: (size: number) => void;
  setRuntime: (runtime: LiveManagedRuntime) => void;
}

const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): T => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

const createSidebarStore = (config: SidebarConfig) => {
  const store = create<SidebarStore>()(
    devtools(
      subscribeWithSelector((set) => ({
        isOpen: false,
        activeItem: config.panels[0],
        size: config.defaultSize || 15,
        runtime: null,
        closePanel: () => set({ isOpen: false }),
        openPanel: () => set({ isOpen: true }),
        setActiveItem: (panelId) => {
          const activeItem = config.panels.find((item) => item.id === panelId);
          if (activeItem) {
            set({ activeItem });
          } else {
            throw new Error(`Panel ${panelId} not found in ${config.name}`);
          }
        },
        setSize: (size) => set({ size }),
        setRuntime: (runtime) => {
          set({ runtime });
          loadState(runtime, config).then(() => {
            setupAutoSave(store, runtime, config.name);
          });
        },
      })),
      { name: config.name },
    ),
  );

  return store;
};

type PersistableState = {
  isOpen: boolean;
  activeItemId: string;
  size: number;
};

const setupAutoSave = (
  store: any,
  runtime: LiveManagedRuntime,
  settingsKey: string,
) => {
  const debouncedSave = debounce(async (state: SidebarStore) => {
    await saveState(state, runtime, settingsKey);
  }, 500); // 500ms delay

  store.subscribe(
    (state: SidebarStore): PersistableState => ({
      isOpen: state.isOpen,
      activeItemId: state.activeItem.id,
      size: state.size,
    }),
    (_: PersistableState) => {
      const fullState = store.getState();
      if (fullState.runtime) {
        debouncedSave(fullState);
      }
    },
    {
      fireImmediately: false,
      equalityFn: (a: PersistableState, b: PersistableState) =>
        a.isOpen === b.isOpen &&
        a.activeItemId === b.activeItemId &&
        a.size === b.size,
    },
  );
};

const loadState = async (
  runtime: LiveManagedRuntime,
  config: SidebarConfig,
) => {
  try {
    const loadEffect = Effect.gen(function* () {
      const settingsClient = yield* SettingsClient;
      return yield* settingsClient.getSetting<
        Pick<SidebarStore, 'isOpen' | 'size'> & { activeItemId: string }
      >(config.name);
    });

    const savedState = await runtime.runPromise(loadEffect);

    if (savedState) {
      const store = getSidebarStore(config.name);
      if (store) {
        const activeItem = config.panels.find(
          (item) => item.id === savedState.activeItemId,
        );

        store.setState({
          isOpen: savedState.isOpen,
          activeItem: activeItem || config.panels[0],
          size: savedState.size,
        });
      }
    }
  } catch (error) {
    console.warn(`Erreur lors du chargement de ${config.name}:`, error);
  }
};

const saveState = async (
  state: SidebarStore,
  runtime: LiveManagedRuntime,
  settingsKey: string,
) => {
  try {
    const stateToSave = {
      isOpen: state.isOpen,
      activeItemId: state.activeItem.id,
      size: state.size,
    };

    const setEffect = Effect.gen(function* () {
      const settingsClient = yield* SettingsClient;
      yield* settingsClient.setSetting(settingsKey, stateToSave);
    });

    await runtime.runPromise(setEffect);
  } catch (error) {
    console.error(`Error when saved state-view ${settingsKey}:`, error);
  }
};

const getSidebarStore = (name: string): any => {
  switch (name) {
    case 'left-sidebar-store':
      return useLeftSidebarStoreInner;
    case 'right-sidebar-store':
      return useRightSidebarStoreInner;
    case 'tools-store':
      return useToolsStoreInner;
    default:
      return null;
  }
};

const useLeftSidebarStoreInner = createSidebarStore({
  name: 'left-sidebar-store',
  panels: leftSidebarPanels,
});
export const useLeftSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useLeftSidebarStoreInner);

const useRightSidebarStoreInner = createSidebarStore({
  name: 'right-sidebar-store',
  panels: rightSidebarPanels,
});
export const useRightSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useRightSidebarStoreInner);

const useToolsStoreInner = createSidebarStore({
  name: 'tools-store',
  panels: leftSidebarTools,
});
export const useToolsStore = () =>
  useStoreRuntime<SidebarStore>(useToolsStoreInner);
