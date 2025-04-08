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

interface StoreProviderProps {
  children: ReactNode;
  stores: Array<{
    key: string;
    defaultValue?: any;
  }>;
}

// Individual store component to handle a single store
const StoreInstance = <T,>({
  storeKey,
  defaultValue,
}: {
  storeKey: string;
  defaultValue?: T;
}) => {
  const store = useStore<T>(storeKey, defaultValue);

  // Update the parent context when this store changes
  const contextValue = useContext(StoreContext);

  // Set this store in the context
  React.useEffect(() => {
    contextValue[storeKey] = store;

    // If we have a value, make sure it's loaded
    if (store.value === undefined && !store.loading && !store.error) {
      store.refreshValue();
    }
  }, [contextValue, store, storeKey]);

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
