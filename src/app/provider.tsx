import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryConfig } from '@/lib/react-query';
import { ThemeProvider } from '@/features/settings/components/theme/provider';
import { StoreProvider } from '@/features/settings/providers/store.provider';
import { defaultSettings } from '@/config/defaultSettings';

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
              {import.meta.env.DEV && <ReactQueryDevtools />}
              {children}
            </QueryClientProvider>
          </ThemeProvider>
        </StoreProvider>
      </HelmetProvider>
    </React.Suspense>
  );
};
