import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { invoke } from '@tauri-apps/api/core';

// Types pour le provider
interface DslEditorState {
  dsl_file_content: number[];
  simulation_name: string;
  artifact_id: string;
}

interface DslEditorContextType {
  // État actuel
  dslState: DslEditorState;

  // Actions
  setDslFileContent: (content: number[]) => void;
  setSimulationName: (name: string) => void;
  setArtifactId: (id: string) => void;
  updateDslState: (updates: Partial<DslEditorState>) => void;

  // Méthodes utilitaires
  loadDslFile: (filePath: string) => Promise<void>;
  saveDslFile: (filePath: string, content?: string) => Promise<void>;
  resetDslState: () => void;

  // États de chargement
  isLoading: boolean;
  error: string | null;
}

// État initial du provider
const initialDslState: DslEditorState = {
  dsl_file_content: [],
  simulation_name: '',
  artifact_id: 'ieee14bus', // Valeur par défaut basée sur votre code
};

// Création du contexte
const DslEditorContext = createContext<DslEditorContextType | undefined>(
  undefined,
);

// Props du provider
interface DslEditorProviderProps {
  children: React.ReactNode;
  defaultArtifactId?: string;
}

// Provider component
export const DslEditorProvider: React.FC<DslEditorProviderProps> = ({
  children,
  defaultArtifactId = 'ieee14bus',
}) => {
  // États locaux
  const [dslState, setDslState] = useState<DslEditorState>({
    ...initialDslState,
    artifact_id: defaultArtifactId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter les race conditions
  const isMountedRef = useRef(true);

  // Action pour mettre à jour le contenu du fichier DSL
  const setDslFileContent = useCallback((content: number[]) => {
    if (!isMountedRef.current) return;

    setDslState((prev) => ({
      ...prev,
      dsl_file_content: content,
    }));
  }, []);

  // Action pour mettre à jour le nom de simulation
  const setSimulationName = useCallback((name: string) => {
    if (!isMountedRef.current) return;

    setDslState((prev) => ({
      ...prev,
      simulation_name: name,
    }));
  }, []);

  // Action pour mettre à jour l'artifact ID
  const setArtifactId = useCallback((id: string) => {
    if (!isMountedRef.current) return;

    setDslState((prev) => ({
      ...prev,
      artifact_id: id,
    }));
  }, []);

  // Action pour mettre à jour plusieurs propriétés à la fois
  const updateDslState = useCallback((updates: Partial<DslEditorState>) => {
    if (!isMountedRef.current) return;

    setDslState((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Méthode pour charger un fichier DSL via Tauri
  const loadDslFile = useCallback(async (filePath: string) => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Appel à la fonction Tauri pour lire le fichier
      const content = await invoke<string>('read_dsl_file', {
        file_path: filePath,
      });

      if (isMountedRef.current) {
        // Convertir le contenu en bytes
        const dslContentBytes = new TextEncoder().encode(content);

        setDslState((prev) => ({
          ...prev,
          dsl_file_content: Array.from(dslContentBytes),
        }));
      }
    } catch (err) {
      console.error('Error loading DSL file:', err);
      if (isMountedRef.current) {
        setError(`Failed to load file: ${err}`);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Méthode pour sauvegarder un fichier DSL via Tauri
  const saveDslFile = useCallback(
    async (filePath: string, content?: string) => {
      if (!isMountedRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        // Utiliser le contenu fourni ou convertir le contenu actuel
        const contentToSave =
          content ||
          new TextDecoder().decode(new Uint8Array(dslState.dsl_file_content));

        // Appel à la fonction Tauri pour écrire le fichier
        await invoke('write_dsl_file', {
          file_path: filePath,
          content: contentToSave,
        });

        // Mettre à jour le contenu local si c'est un nouveau contenu
        if (content && isMountedRef.current) {
          const dslContentBytes = new TextEncoder().encode(content);
          setDslState((prev) => ({
            ...prev,
            dsl_file_content: Array.from(dslContentBytes),
          }));
        }
      } catch (err) {
        console.error('Error saving DSL file:', err);
        if (isMountedRef.current) {
          setError(`Failed to save file: ${err}`);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [dslState.dsl_file_content],
  );

  // Méthode pour réinitialiser l'état
  const resetDslState = useCallback(() => {
    if (!isMountedRef.current) return;

    setDslState({
      ...initialDslState,
      artifact_id: defaultArtifactId,
    });
    setError(null);
  }, [defaultArtifactId]);

  // Cleanup lors du démontage
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Valeur du contexte
  const contextValue: DslEditorContextType = {
    dslState,
    setDslFileContent,
    setSimulationName,
    setArtifactId,
    updateDslState,
    loadDslFile,
    saveDslFile,
    resetDslState,
    isLoading,
    error,
  };

  return (
    <DslEditorContext.Provider value={contextValue}>
      {children}
    </DslEditorContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useDslEditor = (): DslEditorContextType => {
  const context = useContext(DslEditorContext);

  if (context === undefined) {
    throw new Error('useDslEditor must be used within a DslEditorProvider');
  }

  return context;
};

// Hook personnalisé pour obtenir uniquement l'état (lecture seule)
export const useDslState = (): DslEditorState => {
  const { dslState } = useDslEditor();
  return dslState;
};

// Hook personnalisé pour obtenir uniquement les actions
export const useDslActions = () => {
  const {
    setDslFileContent,
    setSimulationName,
    setArtifactId,
    updateDslState,
    loadDslFile,
    saveDslFile,
    resetDslState,
  } = useDslEditor();

  return {
    setDslFileContent,
    setSimulationName,
    setArtifactId,
    updateDslState,
    loadDslFile,
    saveDslFile,
    resetDslState,
  };
};

// Types exportés pour utilisation dans d'autres composants
export type { DslEditorState, DslEditorContextType };
