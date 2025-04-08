import { ServerUrlServiceLive } from '@/features/settings/components/url/services/server-url';
import { StoreServiceLive } from '@/utils/store-service';
import { Effect, pipe } from 'effect';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StoreServiceTag } from '@/utils/store-service';
import { ServerUrlServiceTag } from '@/features/settings/components/url/services/server-url';

// Define our environment type
type AppEnv = StoreServiceTag | ServerUrlServiceTag;

// Type for our runWithServices function
export type RunWithServices = <E, A>(
  effect: Effect.Effect<AppEnv, E, A>,
) => Promise<A>;

// Type for our services context
interface ServicesContextType {
  initialized: boolean;
  error: Error | null;
  runWithServices: RunWithServices;
}

// Create context with default values
const ServicesContext = createContext<ServicesContextType>({
  initialized: false,
  error: null,
  runWithServices: () => Promise.reject(new Error('Services not initialized')),
});

// Hook to use the services context
export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context.initialized && !context.error) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};

// Alternative implementation using pipe and explicit type casting
const runWithServices: RunWithServices = <E, A>(
  effect: Effect.Effect<AppEnv, E, A>,
): Promise<A> => {
  const program = pipe(
    effect,
    Effect.provide(ServerUrlServiceLive),
    Effect.provide(StoreServiceLive),
  ) as Effect.Effect<never, E, A>; // Explicitly cast to never environment

  // @ts-ignore - TODO: need to create Main type for all services
  return Effect.runPromise(program);
};

// Provider props
interface ServicesProviderProps {
  children: React.ReactNode;
  onInitialized?: (runWithServices: RunWithServices) => void;
}

export const ServicesProvider: React.FC<ServicesProviderProps> = ({
  children,
  onInitialized,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Test that our layers can be initialized correctly
        const testProgram = pipe(
          Effect.succeed('Services initialized'),
          Effect.provide(ServerUrlServiceLive),
          Effect.provide(StoreServiceLive),
        );

        await Effect.runPromise(testProgram);
        setInitialized(true);

        // Call the callback with the runWithServices function
        if (onInitialized) {
          onInitialized(runWithServices);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to initialize services'),
        );
      }
    };

    init();
  }, [onInitialized]);

  // Create the context value
  const contextValue: ServicesContextType = {
    initialized,
    error,
    runWithServices,
  };

  if (!initialized && error) {
    return <div>Error initializing services: {error.message}</div>;
  }

  if (!initialized) {
    return <div>Loading services...</div>;
  }

  return (
    <ServicesContext.Provider value={contextValue}>
      {children}
    </ServicesContext.Provider>
  );
};
