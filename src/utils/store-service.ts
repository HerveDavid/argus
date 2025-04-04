import { LazyStore } from '@tauri-apps/plugin-store';
import { Effect, Context, Layer } from 'effect';
import { appDataDir } from '@tauri-apps/api/path';

// -------------- CORE STORE SERVICE ---------------
// Base interface for the storage service
export interface StoreService {
  readonly _tag: 'StoreService';
  readonly set: <T>(key: string, value: T) => Effect.Effect<void, Error, never>;
  readonly get: <T>(key: string) => Effect.Effect<T | null, Error, never>;
  readonly delete: (key: string) => Effect.Effect<void, Error, never>;
  readonly save: () => Effect.Effect<void, Error, never>;
  readonly reload: () => Effect.Effect<void, Error, never>;
}

export class StoreServiceTag extends Context.Tag('StoreService')<
  StoreServiceTag,
  StoreService
>() {}

// Singleton to manage the store state
class StoreManager {
  private static instance: StoreManager;
  private store: LazyStore;
  private initialized: boolean = false;
  private initPromise: Promise<void>;

  private constructor(filename: string) {
    this.store = new LazyStore(filename, { autoSave: true });
    // Initialize immediately and store the promise
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

// Implementation of StoreService that uses the singleton
export const makeStoreService = (filename: string) =>
  Effect.gen(function* (_) {
    const manager = StoreManager.getInstance(filename);
    // Ensure that the store is initialized before continuing
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
            return;
          },
          catch: (error) => new Error(`Failed to set ${key}: ${error}`),
        }),
      get: <T>(key: string) =>
        Effect.tryPromise({
          try: async () => {
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
      reload: () =>
        Effect.tryPromise({
          try: async () => await store.reload(),
          catch: (error) => new Error(`Failed to reload store: ${error}`),
        }),
    };

    return serviceImpl;
  });

// Function to get the app data path
export const getStoreFilePath = () =>
  Effect.tryPromise({
    try: async () => {
      // Get the app data directory path
      const dir = await appDataDir();
      // Combine with the filename
      return `${dir}/settings.json`;
    },
    catch: (error) => new Error(`Failed to get app data directory: ${error}`),
  });

// Layer to provide the StoreService with a Tauri path
export const StoreServiceLive = Layer.effect(
  StoreServiceTag,
  Effect.flatMap(getStoreFilePath(), makeStoreService),
);
