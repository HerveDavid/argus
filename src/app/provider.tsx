import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryConfig } from '@/lib/react-query';
import { ThemeProvider } from '@/features/settings/components/theme/provider';
import { StoreProvider } from '@/features/settings/providers/store.provider';
import { loadServerUrl } from '@/features/settings/components/url/hooks/use-server-url';

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

  const serverUrlLoader = React.useCallback(async () => {
    try {
      const result = await loadServerUrl();
      return result;
    } catch (error) {
      console.error('Error in serverUrlLoader:', error);
      // Return default value on error to prevent breaking the app
      return { url: 'http://localhost:8000', status: 'not_configured' };
    }
  }, []);
  return (
    <React.Suspense>
      <HelmetProvider>
        <StoreProvider
          stores={[
            {
              key: 'server_url',
              defaultValue: {
                url: 'http://localhost:8000',
                status: 'not_configured',
              },
              loader: serverUrlLoader
            },
          ]}
        >
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
