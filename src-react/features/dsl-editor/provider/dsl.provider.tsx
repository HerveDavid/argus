import {
  InitScenarioRequest,
  SimulationConfig,
} from '@/services/common/game-master-client2';
import { useAtom, Result } from '@effect-atom/atom-react';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { loadDslAtom } from '../services/load-dsl';

type DslContextType = {
  // DSL Loading
  simulationConfig: SimulationConfig | null;
  loadDsl: () => void;
  isLoading: boolean;
  error: string | null;

  // Informations sur le fichier chargé
  currentFileName: string | null;
  setCurrentFileName: (fileName: string) => void;

  // InitScenarioRequest state
  initScenarioRequest: InitScenarioRequest | null;
  setInitScenarioRequest: (request: InitScenarioRequest) => void;
  updateInitScenarioRequest: (updates: Partial<InitScenarioRequest>) => void;
};

const DslContext = createContext<DslContextType | undefined>(undefined);

export const useDsl = () => {
  const context = useContext(DslContext);
  if (!context) {
    throw new Error('useDsl must be used within DslProvider');
  }
  return context;
};

export const DslProvider = ({ children }: { children: React.ReactNode }) => {
  // InitScenarioRequest state - État immédiat pour les opérations
  const [initScenarioRequest, setInitScenarioRequestInternal] =
    useState<InitScenarioRequest | null>(null);

  // État pour le dernier contenu DSL mis à jour (pour éviter les appels inutiles)
  const [latestDslContent, setLatestDslContent] =
    useState<InitScenarioRequest | null>(null);

  // État pour le nom du fichier actuellement chargé
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  // DSL Loading
  const [dslResult, loadDslAction] = useAtom(loadDslAtom);

  // Refs pour gérer les timeouts de debounce
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction setInitScenarioRequest sans debounce (pour les actions immédiates)
  const setInitScenarioRequest = useCallback((request: InitScenarioRequest) => {
    setInitScenarioRequestInternal(request);
    setLatestDslContent(request);
  }, []);

  // Fonction updateInitScenarioRequest avec debounce pour les éditions
  const updateInitScenarioRequest = useCallback(
    (updates: Partial<InitScenarioRequest>) => {
      // Mise à jour immédiate de l'état local
      setInitScenarioRequestInternal((prev) => {
        const updated = prev
          ? { ...prev, ...updates }
          : (updates as InitScenarioRequest);
        return updated;
      });

      // Annuler le timeout précédent s'il existe
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Debounce pour la mise à jour du contenu final
      updateTimeoutRef.current = setTimeout(() => {
        setLatestDslContent((prev) =>
          prev ? { ...prev, ...updates } : (updates as InitScenarioRequest),
        );
        updateTimeoutRef.current = null;
      }, 250);
    },
    [],
  );

  // Fonction loadDsl qui utilise le dernier contenu DSL disponible
  const loadDsl = useCallback(() => {
    const contentToLoad = latestDslContent || initScenarioRequest;
    if (contentToLoad) {
      console.log('Loading DSL with content:', contentToLoad);
      loadDslAction(contentToLoad);
    } else {
      console.warn('No DSL content to load');
    }
  }, [latestDslContent, initScenarioRequest, loadDslAction]);

  // Nettoyage des timeouts lors du démontage du composant
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Mise à jour automatique du latestDslContent si initScenarioRequest change directement
  useEffect(() => {
    if (initScenarioRequest && !latestDslContent) {
      setLatestDslContent(initScenarioRequest);
    }
  }, [initScenarioRequest, latestDslContent]);

  const store = React.useMemo(() => {
    // DSL Loading
    const simulationConfig = Result.match(dslResult, {
      onSuccess: ({ value }) => value,
      onFailure: () => null,
      onInitial: () => null,
    });

    const error = Result.match(dslResult, {
      onSuccess: () => null,
      onFailure: (err) => err.cause.toString(),
      onInitial: () => null,
    });

    const isLoading = Result.match(dslResult, {
      onSuccess: () => false,
      onFailure: () => false,
      onInitial: () => true,
    });

    return {
      // DSL Loading
      simulationConfig,
      loadDsl,
      isLoading,
      error,

      // Informations sur le fichier
      currentFileName,
      setCurrentFileName,

      // InitScenarioRequest state
      initScenarioRequest,
      setInitScenarioRequest,
      updateInitScenarioRequest,
    };
  }, [
    dslResult,
    loadDsl,
    currentFileName,
    initScenarioRequest,
    setInitScenarioRequest,
    updateInitScenarioRequest,
  ]);

  return <DslContext.Provider value={store}>{children}</DslContext.Provider>;
};
