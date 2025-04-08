import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryConfig } from '@/lib/react-query';
import { ThemeProvider } from '@/features/settings/components/theme/provider';
import { StoreProvider } from '@/features/settings/providers/store.provider';
import { ServerUrlError } from '@/features/settings/components/url/types/url.type';
import { setServerUrl } from '@/features/settings/components/url/api';

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

  // Exemple de handler asynchrone pour la configuration serveur
  const handleServerConfig = async (serverConfig: {
    url: string;
    status: string;
  }) => {
    try {
      const { url } = serverConfig;
      await setServerUrl(url);
    } catch (err) {
      const serverError = err as ServerUrlError;
      throw serverError;
    }
  };

  const defaultSettings = [
    {
      key: 'server_url',
      defaultValue: {
        url: '',
        status: 'not_configured',
      },
      handler: handleServerConfig,
    },
    {
      key: 'preferences',
      defaultValue: {
        theme: 'light',
      },
    },
  ];

  return (
    <React.Suspense>
      <HelmetProvider>
        <StoreProvider stores={defaultSettings}>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              {import.meta.env.DEV && <ReactQueryDevtools />}
              {children}
            </QueryClientProvider>
          </ThemeProvider>
        </StoreProvider>
      </HelmetProvider>
    </React.Suspense>
  );
};
