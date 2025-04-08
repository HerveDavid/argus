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

  // Exemple de handler asynchrone pour la configuration serveur
  const handleServerConfig = async (serverConfig: {
    url: string;
    status: string;
  }) => {
    console.log('Configuration serveur modifiée:', serverConfig);

    const { url, status } = serverConfig;

    if (status === 'configured' && url) {
      console.log(`Initialisation de la connexion à ${url}`);

      try {
        // Simulation d'une opération asynchrone (comme un fetch)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Simuler une vérification de connexion
        console.log(`Connexion réussie à ${url}`);

        // Vous pourriez par exemple initialiser d'autres services ici
        // ou mettre à jour d'autres stores en fonction du résultat
      } catch (error) {
        console.error(`Échec de la connexion à ${url}:`, error);
      }
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
