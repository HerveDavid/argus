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

// Type pour la réponse de la commande Tauri init_game_master_scenario
interface SimulationConfig {
  simulationName: string;
  startTime: number;
  endTime: number;
  timeStep: number;
  currentStep: number;
  actions: Action[];
}

interface Action {
  timestamp: number;
  actionType: string;
  details: ActionDetails;
  interval_start?: number;
  interval_end?: number;
  law?: string;
  metadata?: any;
}

interface ActionDetails {
  elementId?: string | string[];
  percentage?: number;
  component_type?: string;
  id?: string;
  additional_params?: any;
}

// Types pour les artefacts IIDM
interface IidmArtifact {
  artifactId: string;
  description: string | null;
  uploadedAt: string;
  iidmPath: string;
  networkDataPath: string;
  metadataPath: string;
}

interface IidmArtifactListResponse {
  items: IidmArtifact[];
  count: number;
}

interface IidmUploadResponse {
  artifactId: string;
  message: string;
}

// Types d'erreurs spécifiques
interface TauriError {
  message: string;
  code?: string;
  details?: any;
}

class DslEditorError extends Error {
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'DslEditorError';
    this.code = code;
    this.details = details;
  }
}

interface DslEditorContextType {
  // État actuel
  dslState: DslEditorState;

  // Actions DSL
  setDslFileContent: (content: number[]) => void;
  setSimulationName: (name: string) => void;
  setArtifactId: (id: string) => void;
  updateDslState: (updates: Partial<DslEditorState>) => void;

  // Méthodes utilitaires DSL
  loadDslFile: (filePath: string) => Promise<void>;
  saveDslFile: (filePath: string, content?: string) => Promise<void>;
  initDslFile: () => Promise<SimulationConfig>;
  resetDslState: () => void;

  // Nouvelles méthodes pour les artefacts IIDM
  setArtifact: (
    fileContent: number[],
    fileName: string,
    description?: string,
  ) => Promise<IidmUploadResponse>;
  getArtifacts: () => Promise<IidmArtifact[]>;
  loadArtifact: (fileId: string) => Promise<any>;

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

  // Fonction utilitaire pour gérer les erreurs Tauri
  const handleTauriError = (err: unknown): DslEditorError => {
    if (typeof err === 'string') {
      return new DslEditorError(err);
    }

    if (err && typeof err === 'object') {
      const tauriError = err as TauriError;
      return new DslEditorError(
        tauriError.message || 'Unknown error occurred',
        tauriError.code,
        tauriError.details,
      );
    }

    return new DslEditorError('An unexpected error occurred');
  };

  // Fonction utilitaire pour valider l'état avant les opérations
  const validateDslState = (): void => {
    if (dslState.dsl_file_content.length === 0) {
      throw new DslEditorError(
        'DSL file content is empty. Please load a DSL file first.',
        'EMPTY_DSL_CONTENT',
      );
    }

    if (!dslState.simulation_name.trim()) {
      throw new DslEditorError(
        'Simulation name is required.',
        'MISSING_SIMULATION_NAME',
      );
    }

    if (!dslState.artifact_id.trim()) {
      throw new DslEditorError(
        'Artifact ID is required.',
        'MISSING_ARTIFACT_ID',
      );
    }
  };

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
      if (!filePath.trim()) {
        throw new DslEditorError(
          'File path cannot be empty',
          'INVALID_FILE_PATH',
        );
      }

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
      const dslError = handleTauriError(err);

      if (isMountedRef.current) {
        setError(`Failed to load file "${filePath}": ${dslError.message}`);
      }

      throw dslError;
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
        if (!filePath.trim()) {
          throw new DslEditorError(
            'File path cannot be empty',
            'INVALID_FILE_PATH',
          );
        }

        // Utiliser le contenu fourni ou convertir le contenu actuel
        const contentToSave =
          content ||
          new TextDecoder().decode(new Uint8Array(dslState.dsl_file_content));

        if (!contentToSave.trim()) {
          throw new DslEditorError(
            'Cannot save empty content',
            'EMPTY_CONTENT',
          );
        }

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
        const dslError = handleTauriError(err);

        if (isMountedRef.current) {
          setError(`Failed to save file "${filePath}": ${dslError.message}`);
        }

        throw dslError;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [dslState.dsl_file_content],
  );

  // Nouvelle méthode pour initialiser le scénario DSL (avec chargement d'artefact intégré)
  const initDslFile = useCallback(async (): Promise<SimulationConfig> => {
    if (!isMountedRef.current) {
      throw new DslEditorError('Component is unmounted', 'COMPONENT_UNMOUNTED');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Valider l'état avant l'initialisation
      validateDslState();

      // Charger les propriétés de l'artefact avant l'initialisation
      if (dslState.artifact_id.trim()) {
        try {
          const artifactProperties = await invoke<any>(
            'get_iidm_properties_command',
            {
              file_id: dslState.artifact_id.trim(),
            },
          );
          console.log(
            'Artifact properties loaded for initialization:',
            artifactProperties,
          );
        } catch (artifactError) {
          console.warn(
            'Failed to load artifact properties, continuing with initialization:',
            artifactError,
          );
          // Ne pas bloquer l'initialisation si le chargement des propriétés échoue
        }
      }

      // Préparer les paramètres optionnels
      const simulationName = dslState.simulation_name.trim() || undefined;
      const artifactId = dslState.artifact_id.trim() || undefined;

      // Appel à la commande Tauri
      const simulationConfig = await invoke<SimulationConfig>(
        'init_game_master_scenario',
        {
          dsl_file_content: dslState.dsl_file_content,
          simulation_name: simulationName,
          artifact_id: artifactId,
        },
      );

      // Vérifier que la réponse est valide
      if (!simulationConfig || typeof simulationConfig !== 'object') {
        throw new DslEditorError(
          'Invalid response from game master initialization',
          'INVALID_RESPONSE',
        );
      }

      // Optionnel : mettre à jour le nom de simulation avec la réponse du serveur
      if (simulationConfig.simulationName && isMountedRef.current) {
        setDslState((prev) => ({
          ...prev,
          simulation_name: simulationConfig.simulationName,
        }));
      }

      console.log('DSL scenario initialized successfully:', simulationConfig);
      return simulationConfig;
    } catch (err) {
      console.error('Error initializing DSL scenario:', err);
      const dslError = handleTauriError(err);

      if (isMountedRef.current) {
        setError(`Failed to initialize DSL scenario: ${dslError.message}`);
      }

      throw dslError;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dslState]);

  // Nouvelle méthode pour uploader un artefact IIDM
  const setArtifact = useCallback(
    async (
      fileContent: number[],
      fileName: string,
      description?: string,
    ): Promise<IidmUploadResponse> => {
      if (!isMountedRef.current) {
        throw new DslEditorError(
          'Component is unmounted',
          'COMPONENT_UNMOUNTED',
        );
      }

      setIsLoading(true);
      setError(null);

      try {
        if (!fileContent || fileContent.length === 0) {
          throw new DslEditorError(
            'File content cannot be empty',
            'EMPTY_FILE_CONTENT',
          );
        }

        if (!fileName.trim()) {
          throw new DslEditorError(
            'File name cannot be empty',
            'INVALID_FILE_NAME',
          );
        }

        // Appel à la commande Tauri pour uploader le fichier IIDM
        const response = await invoke<IidmUploadResponse>(
          'upload_iidm_file_command',
          {
            file_content: fileContent,
            file_name: fileName.trim(),
            artifact_id: dslState.artifact_id.trim() || undefined,
          },
        );

        // Vérifier que la réponse est valide
        if (!response || typeof response !== 'object') {
          throw new DslEditorError(
            'Invalid response from IIDM upload',
            'INVALID_RESPONSE',
          );
        }

        console.log('IIDM artifact uploaded successfully:', response);
        return response;
      } catch (err) {
        console.error('Error uploading IIDM artifact:', err);
        const dslError = handleTauriError(err);

        if (isMountedRef.current) {
          setError(`Failed to upload IIDM artifact: ${dslError.message}`);
        }

        throw dslError;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [dslState.artifact_id],
  );

  // Nouvelle méthode pour lister les artefacts IIDM sauvegardés
  const getArtifacts = useCallback(async (): Promise<IidmArtifact[]> => {
    if (!isMountedRef.current) {
      throw new DslEditorError('Component is unmounted', 'COMPONENT_UNMOUNTED');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Appel à la commande Tauri pour lister les artefacts IIDM
      const response = await invoke<IidmArtifactListResponse>(
        'list_saved_iidm_command',
      );

      // Vérifier que la réponse est valide
      if (
        !response ||
        typeof response !== 'object' ||
        !Array.isArray(response.items)
      ) {
        throw new DslEditorError(
          'Invalid response format for IIDM artifacts list',
          'INVALID_RESPONSE_FORMAT',
        );
      }

      console.log('IIDM artifacts retrieved successfully:', response);
      return response.items;
    } catch (err) {
      console.error('Error retrieving IIDM artifacts:', err);
      const dslError = handleTauriError(err);

      if (isMountedRef.current) {
        setError(`Failed to retrieve IIDM artifacts: ${dslError.message}`);
      }

      throw dslError;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Nouvelle méthode pour charger les propriétés d'un artefact IIDM spécifique
  const loadArtifact = useCallback(async (fileId: string): Promise<any> => {
    if (!isMountedRef.current) {
      throw new DslEditorError('Component is unmounted', 'COMPONENT_UNMOUNTED');
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!fileId.trim()) {
        throw new DslEditorError('File ID cannot be empty', 'INVALID_FILE_ID');
      }

      // Appel à la commande Tauri pour récupérer les propriétés de l'artefact IIDM
      const response = await invoke<any>('get_iidm_properties_command', {
        file_id: fileId.trim(),
      });

      // Vérifier que la réponse est valide
      if (!response || typeof response !== 'object') {
        throw new DslEditorError(
          'Invalid response from IIDM properties',
          'INVALID_RESPONSE',
        );
      }

      console.log('IIDM artifact properties loaded successfully:', response);
      return response;
    } catch (err) {
      console.error('Error loading IIDM artifact properties:', err);
      const dslError = handleTauriError(err);

      if (isMountedRef.current) {
        setError(
          `Failed to load IIDM artifact properties: ${dslError.message}`,
        );
      }

      throw dslError;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

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
    initDslFile,
    resetDslState,
    // Nouvelles méthodes pour les artefacts IIDM
    setArtifact,
    getArtifacts,
    loadArtifact,
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
    initDslFile,
    resetDslState,
    setArtifact,
    getArtifacts,
    loadArtifact,
  } = useDslEditor();

  return {
    setDslFileContent,
    setSimulationName,
    setArtifactId,
    updateDslState,
    loadDslFile,
    saveDslFile,
    initDslFile,
    resetDslState,
    // Nouvelles actions pour les artefacts IIDM
    setArtifact,
    getArtifacts,
    loadArtifact,
  };
};

// Hook spécialisé pour les artefacts IIDM
export const useIidmArtifacts = () => {
  const { setArtifact, getArtifacts, loadArtifact, isLoading, error } =
    useDslEditor();

  return {
    setArtifact,
    getArtifacts,
    loadArtifact,
    isLoading,
    error,
  };
};

// Types exportés pour utilisation dans d'autres composants
export type {
  DslEditorState,
  DslEditorContextType,
  SimulationConfig,
  Action,
  ActionDetails,
  IidmArtifact,
  IidmArtifactListResponse,
  IidmUploadResponse,
};

// Export de la classe d'erreur personnalisée
export { DslEditorError };
