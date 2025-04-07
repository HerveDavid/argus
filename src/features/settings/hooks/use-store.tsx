import { useState, useEffect, useCallback } from 'react';
import { Effect, pipe } from 'effect';
import { StoreServiceTag, StoreServiceLive } from '@/utils/store-service';

/**
 * Hook to easily interact with the StoreService from React components
 *
 * @param key The storage key to access
 * @param defaultValue Optional default value if the key doesn't exist
 * @returns Object containing value, setter, loading state, and error
 */
export function useStore<T>(key: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the value from store
  const refreshValue = useCallback(async () => {
    setLoading(true);
    setError(null);

    const program = pipe(
      Effect.flatMap(StoreServiceTag, (service) => service.get<T>(key)),
      Effect.provide(StoreServiceLive),
    );

    try {
      const result = await Effect.runPromise(program);
      setValue(result !== null ? result : defaultValue);
    } catch (err) {
      const storeError = err as Error;
      setError(storeError.message || `Failed to fetch ${key} from store`);
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue]);

  // Function to update the value in store
  const updateValue = useCallback(
    async (newValue: T) => {
      setLoading(true);
      setError(null);

      const program = pipe(
        Effect.flatMap(StoreServiceTag, (service) =>
          service.set<T>(key, newValue),
        ),
        Effect.provide(StoreServiceLive),
      );

      try {
        await Effect.runPromise(program);
        setValue(newValue);
        return newValue;
      } catch (err) {
        const storeError = err as Error;
        setError(storeError.message || `Failed to update ${key} in store`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [key],
  );

  // Function to delete the value from store
  const deleteValue = useCallback(async () => {
    setLoading(true);
    setError(null);

    const program = pipe(
      Effect.flatMap(StoreServiceTag, (service) => service.delete(key)),
      Effect.provide(StoreServiceLive),
    );

    try {
      await Effect.runPromise(program);
      setValue(defaultValue);
    } catch (err) {
      const storeError = err as Error;
      setError(storeError.message || `Failed to delete ${key} from store`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue]);

  // Load the value when the component mounts
  useEffect(() => {
    refreshValue();
  }, [refreshValue]);

  return {
    value,
    loading,
    error,
    setValue: updateValue,
    deleteValue,
    refreshValue,
  };
}
