import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryConfig } from '@/lib/react-query';
import { useServerUrl } from '@/features/settings/url/hooks/use-server-url';

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

  const { refreshServerUrl } = useServerUrl();

  React.useEffect(() => {
    const initializeServerUrl = async () => {
      await refreshServerUrl();
    };

    initializeServerUrl();
  }, [refreshServerUrl]);

  return (
    <React.Suspense>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          {import.meta.env.DEV && <ReactQueryDevtools />}
          {children}
        </QueryClientProvider>
      </HelmetProvider>
    </React.Suspense>
  );
};
