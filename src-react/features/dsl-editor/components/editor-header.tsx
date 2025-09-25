import React, { useState, useCallback } from 'react';
import { EllipsisVertical, Bug, Upload, CheckCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  SimulationConfig,
  DslEditorError,
  useDslEditor,
  IidmArtifact,
} from '../provider/dsl-editor.provider';
import { useDsl } from '../provider/dsl.provider';
import { ArtifactSelect } from './artifact-select';

interface HeaderProps {
  filepath: string;
}

export const Header: React.FC<HeaderProps> = ({ filepath }) => {
  const [simulationConfig, setSimulationConfig] =
    useState<SimulationConfig | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const { dslState, initDslFile, setArtifactId, isLoading } = useDslEditor();

  // Hook pour le démarrage DSL
  const {
    isReady,
    startDslFile,
    isStarting,
    startError,
    servicesHealthy,
    isRunning,
  } = useDsl();

  // Gérer l'initialisation ET le démarrage DSL
  const handleInitializeAndStart = useCallback(async () => {
    setIsInitializing(true);
    setSimulationConfig(null);

    try {
      // Vérifications préalables
      if (dslState.dsl_file_content.length === 0) {
        throw new Error('No DSL file loaded. Please load a file first.');
      }

      if (!dslState.artifact_id.trim()) {
        throw new Error('Please select an artifact first.');
      }

      // Étape 1: Initialisation
      console.log('Initializing DSL file...');
      const config = await initDslFile();
      setSimulationConfig(config);

      toast.success(
        `Simulation "${config.simulationName}" initialized successfully`,
      );

      console.log('Simulation initialized:', config);

      // Petite pause pour laisser le temps à l'état de se mettre à jour
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Étape 2: Démarrage
      if (isReady && servicesHealthy && !isRunning) {
        console.log('Starting DSL simulation...');
        await startDslFile();

        toast.success(
          `Simulation "${config.simulationName}" started successfully`,
        );
      } else {
        console.warn('Cannot start simulation:', {
          isReady,
          servicesHealthy,
          isRunning,
        });

        if (!servicesHealthy) {
          toast.warning(
            'Services are not healthy. Initialization completed, but simulation not started.',
          );
        } else if (isRunning) {
          toast.info('Simulation is already running.');
        } else if (!isReady) {
          toast.warning('System not ready. Please try starting manually.');
        }
      }
    } catch (err) {
      console.error('Initialization/Start error:', err);

      if (err instanceof DslEditorError) {
        toast.error(`[${err.code}] ${err.message}`);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [
    dslState,
    initDslFile,
    startDslFile,
    isReady,
    servicesHealthy,
    isRunning,
  ]);

  // Gérer la sélection d'artefact
  const handleArtifactSelected = useCallback(
    (artifact: IidmArtifact) => {
      setArtifactId(artifact.artifactId);
      toast.success(`Artifact "${artifact.artifactId}" selected`);
    },
    [setArtifactId],
  );

  // Déterminer le statut du système
  const getSystemStatus = () => {
    if (dslState.dsl_file_content.length === 0) {
      return {
        status: 'no-dsl',
        label: 'No DSL File',
        variant: 'destructive' as const,
      };
    }
    if (!dslState.artifact_id.trim()) {
      return {
        status: 'no-artifact',
        label: 'No Artifact',
        variant: 'secondary' as const,
      };
    }
    if (isRunning) {
      return {
        status: 'running',
        label: 'Running',
        variant: 'default' as const,
      };
    }
    if (simulationConfig) {
      return {
        status: 'ready',
        label: 'Ready',
        variant: 'outline' as const,
      };
    }
    return {
      status: 'loaded',
      label: 'Loaded',
      variant: 'outline' as const,
    };
  };

  const systemStatus = getSystemStatus();
  const canInitialize =
    dslState.dsl_file_content.length > 0 &&
    dslState.artifact_id.trim() !== '' &&
    !isLoading &&
    !isInitializing &&
    !isStarting;

  // Déterminer l'icône et le texte du bouton
  const getButtonContent = () => {
    if (isInitializing || isStarting) {
      return {
        icon: Play,
        text: 'Initializing...',
        className: 'animate-pulse',
      };
    }

    if (!simulationConfig) {
      return {
        icon: Play,
        text: 'Initialize & Start',
        className: '',
      };
    }

    if (isRunning) {
      return {
        icon: CheckCircle,
        text: 'Running',
        className: '',
      };
    }

    return {
      icon: Play,
      text: 'Start',
      className: '',
    };
  };

  const buttonContent = getButtonContent();
  const ButtonIcon = buttonContent.icon;

  return (
    <TooltipProvider>
      <header className="bg-sidecar flex items-center justify-between border-b px-3 py-2">
        {/* Section gauche - Info du fichier */}
        <div className="flex min-w-0 items-center gap-2">
          <EllipsisVertical
            size={16}
            className="text-muted-foreground flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1
              className="text-muted-foreground truncate text-sm font-medium"
              title={filepath}
            >
              {filepath}
            </h1>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant={systemStatus.variant} className="text-xs">
            {systemStatus.label}
          </Badge>
          {simulationConfig && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="mr-1 h-3 w-3" />
              {simulationConfig.simulationName}
            </Badge>
          )}
        </div>

        {/* Section milieu - Informations système */}
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/70">Simulation:</span>
            <span className="font-mono">
              {dslState.simulation_name || 'Not set'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/70">Artifact:</span>
            <span
              className="max-w-24 truncate font-mono"
              title={dslState.artifact_id.split('-')[0]}
            >
              {dslState.artifact_id.split('-')[0] || 'None'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/70">Size:</span>
            <span className="font-mono">
              {dslState.dsl_file_content.length} bytes
            </span>
          </div>
        </div>

        {/* Section droite - Contrôles */}
        <div className="flex items-center gap-2">
          {/* Sélecteur d'artefacts */}
          <div className="w-48">
            <ArtifactSelect
              onArtifactSelected={handleArtifactSelected}
              className="h-8"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={canInitialize ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleInitializeAndStart}
                  disabled={!canInitialize}
                >
                  <ButtonIcon size={16} className={buttonContent.className} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">
                    {!simulationConfig
                      ? 'Initialize & Start DSL Scenario'
                      : isRunning
                        ? 'Simulation Running'
                        : 'Start DSL Scenario'}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {!canInitialize
                      ? dslState.dsl_file_content.length === 0
                        ? 'Load a DSL file first'
                        : !dslState.artifact_id.trim().split('-')[0]
                          ? 'Select an artifact first'
                          : isInitializing || isStarting
                            ? 'Processing...'
                            : 'Not ready'
                      : !simulationConfig
                        ? 'Will initialize and start the simulation'
                        : isRunning
                          ? 'Simulation is currently running'
                          : 'Ready to start'}
                  </p>
                  {startError && (
                    <p className="mt-1 text-xs text-red-500">
                      Error: {startError}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bug size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Debug Scenario</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};
