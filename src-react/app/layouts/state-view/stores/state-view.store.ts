import * as Effect from 'effect/Effect';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import {
  leftSidebarPanels,
  leftSidebarTools,
  rightSidebarPanels,
  rightSidebarTools,
} from '@/config/layouts/scada';
import { LiveManagedRuntime } from '@/config/live-layer';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { SettingsClient } from '@/services/common/settings-client';
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
  // @ts-ignore
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
  }, 500);

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

      const savedState = yield* settingsClient
        .getSetting<
          Pick<SidebarStore, 'isOpen' | 'size'> & { activeItemId: string }
        >(config.name)
        .pipe(
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              yield* Effect.logDebug(
                `Setting '${config.name}' not found, using defaults: ${error.message}`,
              );
              return null;
            }),
          ),
        );

      if (savedState) {
        yield* Effect.logDebug(
          `Loaded state for ${config.name}: ${JSON.stringify(savedState)}`,
        );
      } else {
        yield* Effect.logDebug(
          `No saved state found for ${config.name}, using defaults`,
        );
      }

      return savedState;
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
    const logEffect = Effect.logWarning(
      `Unexpected error loading config ${config.name}: ${error}`,
    );
    await runtime.runPromise(logEffect);
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
      yield* Effect.logDebug(
        `Saved state for ${settingsKey}: ${JSON.stringify(stateToSave)}`,
      );
    });

    await runtime.runPromise(setEffect);
  } catch (error) {
    const logEffect = Effect.logError(
      `Error when saving state ${settingsKey}: ${error}`,
    );
    await runtime.runPromise(logEffect);
  }
};

const getSidebarStore = (name: string): any => {
  switch (name) {
    case 'left-sidebar-store':
      return useLeftSidebarStoreInner;
    case 'right-sidebar-store':
      return useRightSidebarStoreInner;
    case 'left-tools-store':
      return useLeftToolsStoreInner;
    case 'right-tools-store':
      return useRightToolsStoreInner;
    default:
      console.warn(`Unknown sidebar store: ${name}`);
      return null;
  }
};

const useLeftSidebarStoreInner = createSidebarStore({
  name: 'left-sidebar-store',
  panels: leftSidebarPanels,
});
export const useLeftSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useLeftSidebarStoreInner);

const useLeftToolsStoreInner = createSidebarStore({
  name: 'left-tools-store',
  panels: leftSidebarTools,
});
export const useLeftToolsStore = () =>
  useStoreRuntime<SidebarStore>(useLeftToolsStoreInner);

const useRightSidebarStoreInner = createSidebarStore({
  name: 'right-sidebar-store',
  panels: rightSidebarPanels,
});
export const useRightSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useRightSidebarStoreInner);

const useRightToolsStoreInner = createSidebarStore({
  name: 'right-tools-store',
  panels: rightSidebarTools,
});
export const useRightToolsStore = () =>
  useStoreRuntime<SidebarStore>(useRightToolsStoreInner);
