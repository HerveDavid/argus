import * as Effect from 'effect/Effect';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import * as gameMasterLayouts from '@/config/layouts/game-master';
import * as scadaLayouts from '@/config/layouts/scada';
import { LiveManagedRuntime } from '@/config/live-layer';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { SettingsClient } from '@/services/common/settings-client';
import { SidebarItem } from '@/types/sidebar-item';

// Type pour définir les layouts disponibles
type LayoutType = 'game-master' | 'scada';

// Mapping des layouts
const LAYOUTS = {
  'game-master': gameMasterLayouts,
  scada: scadaLayouts,
} as const;

interface SidebarConfig {
  name: string;
  panelsKey:
    | 'leftSidebarPanels'
    | 'leftSidebarTools'
    | 'rightSidebarPanels'
    | 'rightSidebarTools';
  defaultSize?: number;
}

export interface SidebarStore {
  isOpen: boolean;
  activeItem: SidebarItem;
  size: number;
  runtime: LiveManagedRuntime | null;
  currentLayout: LayoutType;
  panels: SidebarItem[];
  closePanel: () => void;
  openPanel: () => void;
  setActiveItem: (panelId: string) => void;
  setSize: (size: number) => void;
  setRuntime: (runtime: LiveManagedRuntime) => void;
  switchLayout: (layout: LayoutType) => void;
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

const getPanelsForLayout = (
  layout: LayoutType,
  panelsKey: string,
): SidebarItem[] => {
  const layoutConfig = LAYOUTS[layout];
  return (layoutConfig as any)[panelsKey] || [];
};

const createSidebarStore = (config: SidebarConfig) => {
  const initialLayout: LayoutType = 'game-master';
  const initialPanels = getPanelsForLayout(initialLayout, config.panelsKey);

  // @ts-ignore
  const store = create<SidebarStore>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        isOpen: false,
        activeItem: initialPanels[0],
        size: config.defaultSize || 15,
        runtime: null,
        currentLayout: initialLayout,
        panels: initialPanels,
        closePanel: () => set({ isOpen: false }),
        openPanel: () => set({ isOpen: true }),
        setActiveItem: (panelId) => {
          const { panels } = get();
          const activeItem = panels.find((item) => item.id === panelId);
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
        switchLayout: (layout: LayoutType) => {
          const newPanels = getPanelsForLayout(layout, config.panelsKey);
          const currentActiveId = get().activeItem?.id;

          // Essayer de garder le même panel actif, sinon prendre le premier
          const newActiveItem =
            newPanels.find((item) => item.id === currentActiveId) ||
            newPanels[0];

          set({
            currentLayout: layout,
            panels: newPanels,
            activeItem: newActiveItem,
          });

          // Sauvegarder immédiatement après le changement de layout
          const { runtime } = get();
          if (runtime) {
            saveState(get(), runtime, config.name);
          }
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
  currentLayout: LayoutType;
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
      currentLayout: state.currentLayout,
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
        a.size === b.size &&
        a.currentLayout === b.currentLayout,
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
          Pick<SidebarStore, 'isOpen' | 'size' | 'currentLayout'> & {
            activeItemId: string;
          }
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
        // Charger les panels pour le layout sauvegardé
        const panels = getPanelsForLayout(
          savedState.currentLayout,
          config.panelsKey,
        );
        const activeItem = panels.find(
          (item) => item.id === savedState.activeItemId,
        );

        store.setState({
          isOpen: savedState.isOpen,
          currentLayout: savedState.currentLayout,
          panels: panels,
          activeItem: activeItem || panels[0],
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
      currentLayout: state.currentLayout,
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
  panelsKey: 'leftSidebarPanels',
});
export const useLeftSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useLeftSidebarStoreInner);

const useLeftToolsStoreInner = createSidebarStore({
  name: 'left-tools-store',
  panelsKey: 'leftSidebarTools',
});
export const useLeftToolsStore = () =>
  useStoreRuntime<SidebarStore>(useLeftToolsStoreInner);

const useRightSidebarStoreInner = createSidebarStore({
  name: 'right-sidebar-store',
  panelsKey: 'rightSidebarPanels',
});
export const useRightSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useRightSidebarStoreInner);

const useRightToolsStoreInner = createSidebarStore({
  name: 'right-tools-store',
  panelsKey: 'rightSidebarTools',
});
export const useRightToolsStore = () =>
  useStoreRuntime<SidebarStore>(useRightToolsStoreInner);

// Hook global pour changer tous les layouts en même temps
export const useLayoutSwitcher = () => {
  const leftSidebar = useLeftSidebarStore();
  const rightSidebar = useRightSidebarStore();
  const leftTools = useLeftToolsStore();
  const rightTools = useRightToolsStore();

  const switchAllLayouts = (layout: LayoutType) => {
    leftSidebar.switchLayout(layout);
    rightSidebar.switchLayout(layout);
    leftTools.switchLayout(layout);
    rightTools.switchLayout(layout);
  };

  const getCurrentLayout = () => {
    return leftSidebar.currentLayout; // Tous devraient être synchronisés
  };

  return {
    switchAllLayouts,
    getCurrentLayout,
    availableLayouts: Object.keys(LAYOUTS) as LayoutType[],
  };
};
