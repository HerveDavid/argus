// StoreContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useStore } from '../hooks/use-store';

// Define the generic type for the store value
type StoreContextValue<T> = {
  value: T | undefined;
  loading: boolean;
  error: string | null;
  setValue: (newValue: T) => Promise<T>;
  deleteValue: () => Promise<void>;
  refreshValue: () => Promise<void>;
};

// Create a context with empty object as default
const StoreContext = createContext<Record<string, any>>({});

// Define the type for custom loaders
type StoreLoader<T> = () => Promise<T>;
type StoreHandler<T> = (value: T) => void | Promise<void>;

interface StoreProviderProps {
  children: ReactNode;
  stores: Array<{
    key: string;
    defaultValue?: any;
    loader?: StoreLoader<any>;
    handler?: StoreHandler<any>;
  }>;
}

// Individual store component to handle a single store
const StoreInstance = <T,>({
  storeKey,
  defaultValue,
  loader,
  handler,
}: {
  storeKey: string;
  defaultValue?: T;
  loader?: StoreLoader<T>;
  handler?: StoreHandler<any>;
}) => {
  const store = useStore<T>(storeKey, defaultValue);

  // Update the parent context when this store changes
  const contextValue = useContext(StoreContext);

  const [initialized, setInitialized] = React.useState(false);

  // Initial load and setup
  React.useEffect(() => {
    const initializeStore = async () => {
      // Set this store in the context
      contextValue[storeKey] = store;

      // If we have a loader and no value is set yet (or we want to refresh from source)
      if (loader && store.value === undefined) {
        try {
          // Load the value from the loader
          const loadedValue = await loader();
          // Save it to the store
          await store.setValue(loadedValue);
        } catch (error) {
          console.error(`Failed to load store ${storeKey}:`, error);
        }
      } else if (defaultValue !== undefined && store.value === undefined) {
        // If we have a default value but no existing value, save the default
        await store.setValue(defaultValue);
      }

      // Important: Set initialized to true after initialization is complete
      setInitialized(true);
    };

    initializeStore();
  }, [contextValue, store, storeKey, loader, defaultValue]);

  // Execute handler when the store value changes
  React.useEffect(() => {
    // Skip if not initialized or no value or no handler
    if (!store.value || !handler) return;

    // Only execute the handler if the store is initialized or the value has changed after initialization
    if (initialized) {
      // Handle both async and sync handlers
      try {
        const result = handler(store.value);

        // If the handler returns a promise, catch any errors
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Error in async handler for ${storeKey}:`, error);
          });
        }
      } catch (error) {
        console.error(`Error in handler for ${storeKey}:`, error);
      }
    }
  }, [store.value, handler, initialized, storeKey]);

  return null; // This is a logic-only component, no UI
};

/**
 * Provider component that makes store values available throughout the app
 * It initializes multiple stores based on the provided configuration
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({
  children,
  stores,
}) => {
  // Create a memoized context value object that will persist across renders
  const contextValue = React.useMemo(() => ({}), []);

  return (
    <StoreContext.Provider value={contextValue}>
      {/* Render each store instance as a component */}
      {stores.map((storeConfig) => (
        <StoreInstance
          key={storeConfig.key}
          storeKey={storeConfig.key}
          defaultValue={storeConfig.defaultValue}
          loader={storeConfig.loader}
          handler={storeConfig.handler}
        />
      ))}
      {children}
    </StoreContext.Provider>
  );
};

/**
 * Custom hook to access a specific store from the context
 * @param key The store key to access
 * @returns The store value and operations
 */
export function useStoreContext<T>(key: string): StoreContextValue<T> {
  const context = useContext(StoreContext);
  if (Object.keys(context).length === 0) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }

  const store = context[key];
  if (!store) {
    throw new Error(
      `Store with key "${key}" not found. Make sure it's included in the StoreProvider configuration.`,
    );
  }

  // If the store exists but the value is undefined and not currently loading,
  // and there's no error, then try to load it automatically
  if (store.value === undefined && !store.loading && !store.error) {
    // Use setTimeout to avoid potential React rendering issues
    setTimeout(() => {
      store.refreshValue();
    }, 0);
  }

  return store as StoreContextValue<T>;
}
