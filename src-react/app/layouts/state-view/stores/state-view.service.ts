import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer } from 'effect';

import { SettingsClient } from '@/services/common/settings-client';
import { ModeClient, ModeType } from '@/services/common/mode-client';

// Service pour gérer les modes avec effect-atom
export class ModeService extends Effect.Service<ModeService>()(
  'app/ModeService',
  {
    dependencies: [ModeClient.Default],
    effect: Effect.gen(function* () {
      const modeClient = yield* ModeClient;

      const switchMode = (mode: ModeType) =>
        Effect.gen(function* () {
          yield* Effect.log(`Switching to mode: ${mode}`);
          return modeClient.switchMode(mode);
        });

      const getCurrentMode = () =>
        Effect.gen(function* () {
          return modeClient.getCurrentMode();
        });

      return {
        switchMode,
        getCurrentMode,
      } as const;
    }),
  },
) {}

// Service pour gérer les settings avec effect-atom
export class AppSettingsService extends Effect.Service<AppSettingsService>()(
  'app/AppSettingsService',
  {
    dependencies: [SettingsClient.Default],
    effect: Effect.gen(function* () {
      const settingsClient = yield* SettingsClient;

      const getSetting = <T>(key: string) =>
        Effect.gen(function* () {
          return yield* settingsClient.getSetting<T>(key);
        });

      const setSetting = <T>(key: string, value: T) =>
        Effect.gen(function* () {
          yield* Effect.log(`Setting ${key} to:`, value);
          return yield* settingsClient.setSetting(key, value);
        });

      return {
        getSetting,
        setSetting,
      } as const;
    }),
  },
) {}

// Runtime principal de l'application
export const AppAtomRuntime = Atom.runtime(
  Layer.mergeAll(
    SettingsClient.Default,
    ModeClient.Default,
    ModeService.Default,
    AppSettingsService.Default,
  ),
);

// Atoms fonctionnels utilisant les services
export const switchModeAtom = AppAtomRuntime.fn(
  Effect.fnUntraced(function* (mode: ModeType) {
    const modeService = yield* ModeService;
    yield* modeService.switchMode(mode);
  }),
);

export const getCurrentModeAtom = AppAtomRuntime.atom(
  Effect.gen(function* () {
    const modeService = yield* ModeService;
    return yield* modeService.getCurrentMode();
  }),
);

// Atom pour gérer les settings de façon réactive
export const settingsAtom = (key: string) =>
  AppAtomRuntime.atom(
    Effect.gen(function* () {
      const settingsService = yield* AppSettingsService;
      return yield* settingsService.getSetting(key);
    }),
  );

// Fonction pour créer un atom de setting avec mise à jour
export const createSettingAtom = <T>(key: string, defaultValue: T) => {
  const getAtom = AppAtomRuntime.atom(
    Effect.gen(function* () {
      const settingsService = yield* AppSettingsService;
      return yield* settingsService
        .getSetting<T>(key)
        .pipe(Effect.catchAll(() => Effect.succeed(defaultValue)));
    }),
  );

  const setAtom = AppAtomRuntime.fn(
    Effect.fnUntraced(function* (value: T) {
      const settingsService = yield* AppSettingsService;
      yield* settingsService.setSetting(key, value);
    }),
  );

  return { getAtom, setAtom };
};

// Factory pour créer des services de sidebar
export const createSidebarService = (config: {
  name: string;
  panels: any[];
  defaultSize?: number;
}) => {
  return class extends Effect.Service<any>()(`sidebar/${config.name}`, {
    dependencies: [AppSettingsService.Default],
    effect: Effect.gen(function* () {
      const settingsService = yield* AppSettingsService;

      const getState = () =>
        settingsService
          .getSetting<{
            isOpen: boolean;
            activeItemId: string;
            size: number;
          }>(config.name)
          .pipe(
            Effect.catchAll(() =>
              Effect.succeed({
                isOpen: false,
                activeItemId: config.panels[0]?.id,
                size: config.defaultSize || 15,
              }),
            ),
          );

      const setState = (state: {
        isOpen?: boolean;
        activeItemId?: string;
        size?: number;
      }) =>
        Effect.gen(function* () {
          const currentState = yield* getState();
          const newState = { ...currentState, ...state };
          yield* settingsService.setSetting(config.name, newState);
        });

      const isOpen = Effect.gen(function* () {
        const state = yield* getState();
        return state.isOpen;
      });

      const activeItem = Effect.gen(function* () {
        const state = yield* getState();
        return (
          config.panels.find((panel) => panel.id === state.activeItemId) ||
          config.panels[0]
        );
      });

      const size = Effect.gen(function* () {
        const state = yield* getState();
        return state.size;
      });

      const closePanel = setState({ isOpen: false });
      const openPanel = setState({ isOpen: true });

      const setActiveItem = (panelId: string) =>
        Effect.gen(function* () {
          const panel = config.panels.find((p) => p.id === panelId);
          if (!panel) {
            yield* Effect.fail(
              new Error(`Panel ${panelId} not found in ${config.name}`),
            );
          }
          yield* setState({ activeItemId: panelId });
        });

      const setSize = (newSize: number) => setState({ size: newSize });

      return {
        isOpen,
        activeItem,
        size,
        closePanel,
        openPanel,
        setActiveItem,
        setSize,
      } as const;
    }),
  }) {};
};

// Export du runtime pour utilisation globale
export { AppAtomRuntime as default };
