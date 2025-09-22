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

// Types pour la réponse de next_step_dsl_command
interface NextStepResponse {
  message: string;
  simulationName: string;
  target_time: number;
}

interface NextStepError {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
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
  // Nouvel état pour savoir si la simulation est en cours d'exécution
  isRunning: boolean;
  // Fonction next step
  nextStepDsl: (dsl: string) => Promise<NextStepResponse | null>;
  isNextStepping: boolean;
  nextStepError: string | null;
  // Fonction stop
  stopOrchestrator: () => Promise<void>;
  isStopping: boolean;
  stopError: string | null;
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
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isNextStepping, setIsNextStepping] = useState<boolean>(false);
  const [nextStepError, setNextStepError] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [stopError, setStopError] = useState<string | null>(null);

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

      // Marquer la simulation comme en cours d'exécution
      setIsRunning(true);

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

  // Fonction pour arrêter l'orchestrateur
  const stopOrchestrator = async (): Promise<void> => {
    // Vérifier que la simulation est en cours d'exécution
    if (!isRunning) {
      setStopError(
        "Impossible d'arrêter : la simulation n'est pas en cours d'exécution",
      );
      return;
    }

    try {
      setIsStopping(true);
      setStopError(null);

      await invoke('stop_orchestrator');

      // Marquer la simulation comme arrêtée
      setIsRunning(false);

      // Optionnel : rafraîchir le status après l'arrêt
      await fetchUserStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de l'arrêt";
      setStopError(errorMessage);
      console.error("Erreur lors de l'arrêt de l'orchestrateur:", err);
    } finally {
      setIsStopping(false);
    }
  };

  // Fonction pour exécuter la prochaine étape DSL
  const nextStepDsl = async (dsl: string): Promise<NextStepResponse | null> => {
    // Vérifier les conditions : simulation ready et en cours d'exécution
    if (simulationStatus !== 'ready') {
      setNextStepError(
        'Impossible d\'exécuter la prochaine étape : le status de la simulation doit être "ready"',
      );
      return null;
    }

    if (!isRunning) {
      setNextStepError(
        "Impossible d'exécuter la prochaine étape : la simulation doit être en cours d'exécution",
      );
      return null;
    }

    try {
      setIsNextStepping(true);
      setNextStepError(null);

      const response = await invoke<NextStepResponse>(
        'enqueue_next_step_dsl_command',
        {
          dsl,
        },
      );

      console.log(dsl);
      console.log(response);

      return response;
    } catch (err) {
      let errorMessage = "Erreur lors de l'exécution de la prochaine étape";

      // Traiter les erreurs spécifiques du format attendu
      if (err && typeof err === 'object' && 'detail' in err) {
        const nextStepErr = err as NextStepError;
        const details = nextStepErr.detail
          .map((detail) => `${detail.loc.join('.')}: ${detail.msg}`)
          .join(', ');
        errorMessage = `Erreur de validation: ${details}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setNextStepError(errorMessage);
      console.error(
        "Erreur lors de l'exécution de la prochaine étape DSL:",
        err,
      );
      return null;
    } finally {
      setIsNextStepping(false);
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
    isRunning,
    nextStepDsl,
    isNextStepping,
    nextStepError,
    stopOrchestrator,
    isStopping,
    stopError,
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
  const { startDslFile, isStarting, startError, isReady, isRunning } = useDsl();
  return { startDslFile, isStarting, startError, isReady, isRunning };
};

// Hook spécialisé pour l'arrêt de l'orchestrateur
export const useStopDsl = () => {
  const { stopOrchestrator, isStopping, stopError, isRunning } = useDsl();
  return { stopOrchestrator, isStopping, stopError, isRunning };
};

// Hook spécialisé pour la prochaine étape DSL
export const useNextStepDsl = () => {
  const {
    nextStepDsl,
    isNextStepping,
    nextStepError,
    simulationStatus,
    isRunning,
  } = useDsl();
  const canExecuteNextStep = simulationStatus === 'ready' && isRunning;

  return {
    nextStepDsl,
    isNextStepping,
    nextStepError,
    canExecuteNextStep,
  };
};
