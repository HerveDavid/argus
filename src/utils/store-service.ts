import { LazyStore } from '@tauri-apps/plugin-store';
import { Effect, Context, Layer } from 'effect';
import { cons } from 'effect/List';

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

// Singleton pour gérer l'état du store
class StoreManager {
  private static instance: StoreManager;
  private store: LazyStore;
  private initialized: boolean = false;
  private initPromise: Promise<void>;

  private constructor(filename: string) {
    this.store = new LazyStore(filename, { autoSave: true });
    // Initialiser immédiatement et stocker la promesse
    this.initPromise = this.store.save().then(() => {
      this.initialized = true;
    });
  }

  public static getInstance(filename: string): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager(filename);
    }
    return StoreManager.instance;
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  public getStore(): LazyStore {
    return this.store;
  }
}

// Implémentation du StoreService qui utilise le singleton
export const makeStoreService = (filename: string) =>
  Effect.gen(function* (_) {
    const manager = StoreManager.getInstance(filename);

    // Assurer que le store est initialisé avant de continuer
    yield* _(
      Effect.tryPromise({
        try: () => manager.ensureInitialized(),
        catch: (error) => new Error(`Failed to initialize store: ${error}`),
      }),
    );

    const store = manager.getStore();

    const serviceImpl: StoreService = {
      _tag: 'StoreService',
      set: <T>(key: string, value: T) =>
        Effect.tryPromise({
          try: async () => {
            await store.set(key, value);
            await store.save();
            console.log('Set', store);
            return;
          },
          catch: (error) => new Error(`Failed to set ${key}: ${error}`),
        }),
      get: <T>(key: string) =>
        Effect.tryPromise({
          try: async () => {
            console.log('Get', store);
            return (await store.get(key)) as T | null;
          },
          catch: (error) => new Error(`Failed to get ${key}: ${error}`),
        }),
      delete: (key: string) =>
        Effect.tryPromise({
          try: async () => {
            await store.delete(key);
            return await store.save();
          },
          catch: (error) => new Error(`Failed to delete ${key}: ${error}`),
        }),
      save: () =>
        Effect.tryPromise({
          try: async () => await store.save(),
          catch: (error) => new Error(`Failed to save store: ${error}`),
        }),
    };

    return serviceImpl;
  });

// Layer pour fournir le StoreService
export const StoreServiceLive = Layer.effect(
  StoreServiceTag,
  makeStoreService('/tmp/settings.json'),
);
