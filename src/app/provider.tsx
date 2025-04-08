import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryConfig } from '@/lib/react-query';
import { ThemeProvider } from '@/features/settings/components/theme/provider';
import { StoreProvider } from '@/features/settings/providers/store.provider';

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

  const serverUrlLoader = async () => {
    // todo
  };

  return (
    <React.Suspense>
      <HelmetProvider>
        <StoreProvider
          stores={[
            {
              key: 'server_url',
              defaultValue: { url: '', status: 'not_configured' },
              loader: serverUrlLoader,
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
