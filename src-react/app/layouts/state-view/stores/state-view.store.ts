import * as Effect from 'effect/Effect';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

import { LiveManagedRuntime } from '@/config/live-layer';
import { useStoreRuntime } from '@/hooks/use-store-runtime';
import { SettingsClient } from '@/services/common/settings-client';
import { SidebarItem } from '@/types/sidebar-item';
import { ModeClient } from '@/services/common/mode-client';

export type ModeType = 'Scada' | 'GameMaster' | 'Kpi';

interface SidebarConfig {
  name: string;
  defaultSize?: number;
}

export interface SidebarStore {
  isOpen: boolean;
  activeItem: SidebarItem | null;
  size: number;
  panels: SidebarItem[];
  runtime: LiveManagedRuntime | null;
  currentMode: ModeType | null;
  closePanel: () => void;
  openPanel: () => void;
  setActiveItem: (panelId: string) => void;
  setSize: (size: number) => void;
  setRuntime: (runtime: LiveManagedRuntime) => void;
  loadPanelsForMode: (mode: ModeType) => Promise<void>;
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

// Fonction pour charger les panels selon le mode
const loadPanelsByMode = async (
  mode: ModeType,
  sidebarName: string,
): Promise<SidebarItem[]> => {
  try {
    let panels: SidebarItem[] = [];

    switch (mode) {
      case 'Scada':
        const scadaConfig = await import('@/config/layouts/scada');
        if (sidebarName.includes('left') && sidebarName.includes('sidebar')) {
          panels = scadaConfig.leftSidebarPanels;
        } else if (
          sidebarName.includes('right') &&
          sidebarName.includes('sidebar')
        ) {
          panels = scadaConfig.rightSidebarPanels;
        } else if (
          sidebarName.includes('left') &&
          sidebarName.includes('tools')
        ) {
          panels = scadaConfig.leftSidebarTools;
        } else if (
          sidebarName.includes('right') &&
          sidebarName.includes('tools')
        ) {
          panels = scadaConfig.rightSidebarTools;
        }
        break;

      case 'GameMaster':
        const gameMasterConfig = await import('@/config/layouts/game-master');
        if (sidebarName.includes('left') && sidebarName.includes('sidebar')) {
          panels = gameMasterConfig.leftSidebarPanels;
        } else if (
          sidebarName.includes('right') &&
          sidebarName.includes('sidebar')
        ) {
          panels = gameMasterConfig.rightSidebarPanels;
        } else if (
          sidebarName.includes('left') &&
          sidebarName.includes('tools')
        ) {
          panels = gameMasterConfig.leftSidebarTools;
        } else if (
          sidebarName.includes('right') &&
          sidebarName.includes('tools')
        ) {
          panels = gameMasterConfig.rightSidebarTools;
        }
        break;

      case 'Kpi':
        // À implémenter quand les configs KPI seront disponibles
        // const kpiConfig = await import('@/config/layouts/kpi');
        // panels = kpiConfig.leftSidebarPanels; // etc...
        console.warn('KPI mode panels not yet implemented');
        panels = [];
        break;

      default:
        console.warn(`Unknown mode: ${mode}`);
        panels = [];
    }

    return panels;
  } catch (error) {
    console.error(`Error loading panels for mode ${mode}:`, error);
    return [];
  }
};

const createSidebarStore = (config: SidebarConfig) => {
  // @ts-ignore
  const store = create<SidebarStore>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        isOpen: false,
        activeItem: null,
        size: config.defaultSize || 15,
        panels: [],
        runtime: null,
        currentMode: null,
        closePanel: () => set({ isOpen: false }),
        openPanel: () => set({ isOpen: true }),
        setActiveItem: (panelId) => {
          const state = get();
          const activeItem = state.panels.find((item) => item.id === panelId);
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
            // Charger les panels pour le mode actuel
            loadPanelsForCurrentMode(store, runtime, config.name);
          });
        },
        loadPanelsForMode: async (mode: ModeType) => {
          const panels = await loadPanelsByMode(mode, config.name);
          const currentState = get();

          // Vérifier si l'activeItem actuel existe dans les nouveaux panels
          let newActiveItem = null;
          if (currentState.activeItem) {
            newActiveItem = panels.find(
              (panel) => panel.id === currentState.activeItem!.id,
            );
          }

          // Si pas d'activeItem valide, prendre le premier panel disponible
          if (!newActiveItem && panels.length > 0) {
            newActiveItem = panels[0];
          }

          set({
            panels,
            currentMode: mode,
            activeItem: newActiveItem,
            // Fermer le panel si aucun panel n'est disponible
            isOpen: panels.length > 0 ? currentState.isOpen : false,
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
  activeItemId: string | null;
  size: number;
  currentMode: ModeType | null;
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
      activeItemId: state.activeItem?.id || null,
      size: state.size,
      currentMode: state.currentMode,
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
        a.currentMode === b.currentMode,
    },
  );
};

const loadPanelsForCurrentMode = async (
  store: any,
  runtime: LiveManagedRuntime,
  sidebarName: string,
) => {
  try {
    const loadEffect = Effect.gen(function* () {
      const modeClient = yield* ModeClient;
      const currentMode = yield* modeClient.getCurrentMode();

      yield* Effect.logDebug(
        `Loading panels for mode ${currentMode} in ${sidebarName}`,
      );

      return currentMode;
    });

    const currentMode = await runtime.runPromise(loadEffect);

    if (currentMode) {
      await store.getState().loadPanelsForMode(currentMode);
    }
  } catch (error) {
    const logEffect = Effect.logWarning(
      `Unexpected error loading panels for ${sidebarName}: ${error}`,
    );
    await runtime.runPromise(logEffect);
  }
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
          Pick<SidebarStore, 'isOpen' | 'size' | 'currentMode'> & {
            activeItemId: string | null;
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
        // Restaurer l'état de base
        store.setState({
          isOpen: savedState.isOpen,
          size: savedState.size,
          currentMode: savedState.currentMode,
        });

        // Si on a un mode sauvegardé, charger les panels et restaurer l'activeItem
        if (savedState.currentMode) {
          await store.getState().loadPanelsForMode(savedState.currentMode);

          // Après avoir chargé les panels, restaurer l'activeItem si possible
          if (savedState.activeItemId) {
            const currentPanels = store.getState().panels;
            const activeItem = currentPanels.find(
              (item: SidebarItem) => item.id === savedState.activeItemId,
            );

            if (activeItem) {
              store.setState({ activeItem });
            }
          }
        }
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
      activeItemId: state.activeItem?.id || null,
      size: state.size,
      currentMode: state.currentMode,
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
});
export const useLeftSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useLeftSidebarStoreInner);

const useLeftToolsStoreInner = createSidebarStore({
  name: 'left-tools-store',
});
export const useLeftToolsStore = () =>
  useStoreRuntime<SidebarStore>(useLeftToolsStoreInner);

const useRightSidebarStoreInner = createSidebarStore({
  name: 'right-sidebar-store',
});
export const useRightSidebarStore = () =>
  useStoreRuntime<SidebarStore>(useRightSidebarStoreInner);

const useRightToolsStoreInner = createSidebarStore({
  name: 'right-tools-store',
});
export const useRightToolsStore = () =>
  useStoreRuntime<SidebarStore>(useRightToolsStoreInner);
