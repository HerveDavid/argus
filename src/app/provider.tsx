import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryConfig } from '@/lib/react-query';
import { StoreProvider, ThemeProvider } from '@/features/settings/providers';
import { defaultSettings } from '@/config/default-settings';

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

  return (
    <React.Suspense>
      <HelmetProvider>
        <StoreProvider stores={defaultSettings}>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </ThemeProvider>
        </StoreProvider>
      </HelmetProvider>
    </React.Suspense>
  );
};
