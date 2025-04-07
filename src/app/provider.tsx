import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryConfig } from '@/lib/react-query';
import {
  RunWithServices,
  ServicesProvider,
} from '@/providers/services.provider';
import { Effect } from 'effect';
import { ServerUrlServiceTag } from '@/features/settings/url/services/server-url';
import { ServerUrlError } from '@/features/settings/url/types/url.type';

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  const [isServicesReady, setIsServicesReady] = React.useState(false);
  // Fonction pour initialiser le serveur URL et marquer l'application comme prête
  const handleServicesInitialized = React.useCallback(
    async (runWithServices: RunWithServices) => {
      try {
        // Initialiser l'URL du serveur directement ici
        await runWithServices(
          Effect.flatMap(ServerUrlServiceTag, (service) =>
            service.getServerUrl(),
          ) as Effect.Effect<any, ServerUrlError, any>,
        );

        // Tout est prêt
        setIsServicesReady(true);
      } catch (error) {
        console.error('Failed to initialize server URL:', error);
        setIsServicesReady(true);
      }
    },
    [],
  );

  return (
    <React.Suspense>
      <HelmetProvider>
        <ServicesProvider onInitialized={handleServicesInitialized}>
          <QueryClientProvider client={queryClient}>
            {import.meta.env.DEV && <ReactQueryDevtools />}
            {isServicesReady && children}
          </QueryClientProvider>
        </ServicesProvider>
      </HelmetProvider>
    </React.Suspense>
  );
};
