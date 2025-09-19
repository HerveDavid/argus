import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { invoke } from '@tauri-apps/api/core';

// Types pour la réponse de l'API
interface SimulationStatus {
  name: string;
  status: 'ready' | 'not_ready';
}

interface ServicesStatus {
  nats: 'healthy' | 'unhealthy';
  minio: 'healthy' | 'unhealthy';
}

interface UserStatus {
  simulation: SimulationStatus;
  services: ServicesStatus;
}

// Interface pour le contexte
interface DslContextType {
  userStatus: UserStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Helpers pour accéder facilement aux données
  simulationName: string | null;
  simulationStatus: 'ready' | 'not_ready' | null;
  isReady: boolean;
  servicesHealthy: boolean;
  // Fonction start
  startDslFile: () => Promise<void>;
  isStarting: boolean;
  startError: string | null;
}

// Création du contexte
const DslContext = createContext<DslContextType | undefined>(undefined);

// Props du provider
interface DslProviderProps {
  children: ReactNode;
  refreshInterval?: number; // Intervalle de refresh en ms (optionnel)
}

// Provider component
export const DslProvider: React.FC<DslProviderProps> = ({
  children,
  refreshInterval = 5000, // 5 secondes par défaut
}) => {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Fonction pour appeler la commande Tauri
  const fetchUserStatus = async (): Promise<void> => {
    try {
      setError(null);
      const response = await invoke<UserStatus>('user_status_command');
      setUserStatus(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la récupération du status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour refetch manuellement
  const refetch = async (): Promise<void> => {
    setIsLoading(true);
    await fetchUserStatus();
  };

  // Fonction pour démarrer le fichier DSL
  const startDslFile = async (): Promise<void> => {
    // Vérifier que le status est ready
    if (!isReady) {
      setStartError(
        'Impossible de démarrer : le status de la simulation doit être "ready"',
      );
      return;
    }

    try {
      setIsStarting(true);
      setStartError(null);

      await invoke('start_dsl_file');

      // Optionnel : rafraîchir le status après le démarrage
      await fetchUserStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors du démarrage';
      setStartError(errorMessage);
      console.error('Erreur lors du démarrage du fichier DSL:', err);
    } finally {
      setIsStarting(false);
    }
  };

  // Effect pour le fetch initial et le refresh périodique
  useEffect(() => {
    // Fetch initial
    fetchUserStatus();

    // Setup du refresh périodique si défini
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchUserStatus, refreshInterval);
    }

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  // Valeurs calculées pour faciliter l'utilisation
  const simulationName = userStatus?.simulation?.name || null;
  const simulationStatus = userStatus?.simulation?.status || null;
  const isReady = simulationStatus === 'ready';
  const servicesHealthy = userStatus?.services
    ? userStatus.services.nats === 'healthy' &&
      userStatus.services.minio === 'healthy'
    : false;

  const contextValue: DslContextType = {
    userStatus,
    isLoading,
    error,
    refetch,
    simulationName,
    simulationStatus,
    isReady,
    servicesHealthy,
    startDslFile,
    isStarting,
    startError,
  };

  return (
    <DslContext.Provider value={contextValue}>{children}</DslContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useDsl = (): DslContextType => {
  const context = useContext(DslContext);
  if (context === undefined) {
    throw new Error('useDsl must be used within a DslProvider');
  }
  return context;
};

// Hook spécialisé pour juste le status de la simulation
export const useSimulationStatus = () => {
  const { simulationName, simulationStatus, isReady } = useDsl();
  return { simulationName, simulationStatus, isReady };
};

// Hook spécialisé pour le status des services
export const useServicesStatus = () => {
  const { userStatus, servicesHealthy } = useDsl();
  return {
    services: userStatus?.services || null,
    servicesHealthy,
  };
};

// Hook spécialisé pour le démarrage DSL
export const useStartDsl = () => {
  const { startDslFile, isStarting, startError, isReady } = useDsl();
  return { startDslFile, isStarting, startError, isReady };
};
