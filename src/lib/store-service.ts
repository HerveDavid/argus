import { LazyStore } from '@tauri-apps/plugin-store';
import { Effect, Context, Layer, pipe } from 'effect';

// -------------- CORE STORE SERVICE ---------------
// Interface de base pour le service de stockage
export interface StoreService {
  readonly _tag: 'StoreService';
  readonly set: <T>(key: string, value: T) => Effect.Effect<void, Error, never>;
  readonly get: <T>(key: string) => Effect.Effect<T | null, Error, never>;
  readonly delete: (key: string) => Effect.Effect<void, Error, never>;
  readonly save: () => Effect.Effect<void, Error, never>;
}

export class StoreServiceTag extends Context.Tag('StoreService')<
  StoreServiceTag,
  StoreService
>() {}

// Implémentation du StoreService basée sur LazyStore de Tauri
export const makeStoreService = (filename: string) =>
  Effect.sync(() => {
    const store = new LazyStore(filename, { autoSave: true });

    const serviceImpl: StoreService = {
      _tag: 'StoreService',
      set: <T>(key: string, value: T) =>
        Effect.tryPromise({
          try: () => store.set(key, value),
          catch: (error) => new Error(`Failed to set ${key}: ${error}`),
        }),
      get: <T>(key: string) =>
        Effect.tryPromise({
          try: async () => (await store.get(key)) as T | null,
          catch: (error) => new Error(`Failed to get ${key}: ${error}`),
        }),
      delete: (key: string) =>
        Effect.tryPromise({
          try: () => store.delete(key),
          catch: (error) => new Error(`Failed to delete ${key}: ${error}`),
        }),
      save: () =>
        Effect.tryPromise({
          try: () => store.save(),
          catch: (error) => new Error(`Failed to save store: ${error}`),
        }),
    };

    return serviceImpl;
  });

// Layer pour fournir le StoreService
export const StoreServiceLive = Layer.effect(
  StoreServiceTag,
  makeStoreService('settings.json'),
);

// -------------- SERVER URL SERVICE ---------------
// Interface pour la gestion du ServerURL
export interface ServerUrlService {
  readonly _tag: 'ServerUrlService';
  readonly getServerUrl: () => Effect.Effect<string | null, Error, never>;
  readonly setServerUrl: (url: string) => Effect.Effect<void, Error, never>;
  readonly resetServerUrl: () => Effect.Effect<void, Error, never>;
}

// Clé de stockage pour l'URL du serveur
const SERVER_URL_KEY = 'server_url';

// Création du Tag pour le service ServerURL
export class ServerUrlServiceTag extends Context.Tag('ServerUrlService')<
  ServerUrlServiceTag,
  ServerUrlService
>() {}

// Implémentation qui utilise le StoreService
export const makeServerUrlService = Effect.gen(function* (_) {
  // Accès au StoreService sous-jacent
  const store = yield* _(StoreServiceTag);

  // Création de l'implémentation
  const serviceImpl: ServerUrlService = {
    _tag: 'ServerUrlService',
    getServerUrl: () => store.get<string>(SERVER_URL_KEY),
    setServerUrl: (url: string) => store.set(SERVER_URL_KEY, url),
    resetServerUrl: () => store.delete(SERVER_URL_KEY),
  };

  return serviceImpl;
});

// Layer qui dépend du StoreService
export const ServerUrlServiceLive = Layer.effect(
  ServerUrlServiceTag,
  makeServerUrlService,
);

// -------------- THEME SERVICE ---------------

// -------------- TYPES DE BASE ---------------
export type Theme = 'light' | 'dark';

// Interface pour la gestion du thème
export interface ThemeService {
  readonly _tag: 'ThemeService';
  readonly getTheme: () => Effect.Effect<Theme | null, Error, never>;
  readonly setTheme: (theme: Theme) => Effect.Effect<void, Error, never>;
  readonly toggleTheme: () => Effect.Effect<Theme, Error, never>;
  readonly resetTheme: () => Effect.Effect<void, Error, never>;
}

// Clé de stockage pour le thème
const THEME_KEY = 'app_theme';
// Thème par défaut si aucun n'est défini
const DEFAULT_THEME: Theme = 'light';

// Création du Tag pour ThemeService
export class ThemeServiceTag extends Context.Tag('ThemeService')<
  ThemeServiceTag,
  ThemeService
>() {}

// Implémentation qui utilise le StoreService
export const makeThemeService = Effect.gen(function* (_) {
  // Accès au StoreService sous-jacent
  const store = yield* _(StoreServiceTag);

  // Création de l'implémentation
  const serviceImpl: ThemeService = {
    _tag: 'ThemeService',
    getTheme: () =>
      pipe(
        store.get<Theme>(THEME_KEY),
        Effect.map((theme) => theme ?? DEFAULT_THEME),
      ),
    setTheme: (theme: Theme) => store.set(THEME_KEY, theme),
    toggleTheme: () =>
      pipe(
        store.get<Theme>(THEME_KEY),
        Effect.map((theme) => {
          const newTheme =
            theme === 'dark' || theme === null ? 'light' : 'dark';
          return newTheme;
        }),
        Effect.tap((newTheme) => store.set(THEME_KEY, newTheme)),
      ),
    resetTheme: () => store.delete(THEME_KEY),
  };

  return serviceImpl;
});

// Layer qui dépend du StoreService
export const ThemeServiceLive = Layer.effect(ThemeServiceTag, makeThemeService);

// -------------- LAYER COMPOSITE ---------------
// Layer qui fournit tous les services
export const AllServicesLive = Layer.mergeAll(
  StoreServiceLive,
  Layer.provide(StoreServiceLive)(ServerUrlServiceLive),
  Layer.provide(StoreServiceLive)(ThemeServiceLive),
);
