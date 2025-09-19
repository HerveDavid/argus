import { Play, Square, Pause, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useDsl } from '../provider/dsl.provider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type SimulationState = 'idle' | 'running' | 'paused';

export const DslCommands = () => {
  const {
    simulationName,
    simulationStatus,
    isReady,
    isLoading: dslLoading,
    startDslFile,
    isStarting,
    startError,
    servicesHealthy,
  } = useDsl();

  // État local pour la simulation (idle, running, paused)
  // Note: Ceci pourrait être déplacé dans le provider si vous avez des commandes pause/stop
  const [simulationState, setSimulationState] =
    useState<SimulationState>('idle');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isRunning = simulationState === 'running';
  const isPaused = simulationState === 'paused';
  const isActive = isRunning || isPaused;
  const isLoading = isActionLoading || isStarting || dslLoading;

  const handlePlay = async () => {
    if (!isReady || isLoading) return;

    try {
      setIsActionLoading(true);

      if (simulationState === 'idle') {
        // Utilise la fonction du provider
        await startDslFile();

        // Si pas d'erreur, on considère que c'est démarré
        if (!startError) {
          setSimulationState('running');
          console.log('Simulation started');
        }
      } else if (simulationState === 'paused') {
        // Resume logic (si vous avez une commande resume)
        // await invoke('resume_dsl_file');
        setSimulationState('running');
        console.log('Simulation resumed');
      }
    } catch (error) {
      console.error('Error with play action:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (!isRunning || isLoading) return;

    try {
      setIsActionLoading(true);
      // await invoke('pause_dsl_file'); // À implémenter dans le provider si nécessaire
      setSimulationState('paused');
      console.log('Simulation paused');
    } catch (error) {
      console.error('Error pausing simulation:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (simulationState === 'idle' || isLoading) return;

    try {
      setIsActionLoading(true);
      // await invoke('stop_dsl_file'); // À implémenter dans le provider si nécessaire
      setSimulationState('idle');
      console.log('Simulation stopped');
    } catch (error) {
      console.error('Error stopping simulation:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStateColor = () => {
    switch (simulationState) {
      case 'running':
        return 'text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]';
      case 'paused':
        return 'text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]';
      default:
        return 'text-color border-border';
    }
  };

  const getStateText = () => {
    if (!isReady) return 'Not Ready';
    if (!servicesHealthy) return 'Services Down';

    switch (simulationState) {
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      default:
        return simulationStatus === 'ready' ? 'Ready' : 'Not Ready';
    }
  };

  // Fonction pour obtenir le nom à afficher
  const getDisplayName = () => {
    return simulationName || 'No file';
  };

  // Afficher les erreurs de démarrage
  const hasError = !!startError;

  return (
    <div className="space-y-2">
      {/* Affichage des erreurs */}
      {hasError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          <span className="font-medium">Start Error:</span> {startError}
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-2 rounded-lg p-2 transition-all duration-200',
          isRunning && 'border-2 border-green-500/30 bg-green-500/10',
          hasError && 'border-2 border-red-500/30 bg-red-500/10',
        )}
      >
        <div className="flex items-center gap-1">
          {/* Play/Pause Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 transition-all duration-200',
                  (!isReady || !servicesHealthy) &&
                    'cursor-not-allowed opacity-50',
                )}
                onClick={isRunning ? handlePause : handlePlay}
                disabled={!isReady || !servicesHealthy || isLoading}
              >
                {isRunning ? (
                  <Pause
                    size={16}
                    className="text-yellow-600 transition-colors hover:text-yellow-700"
                  />
                ) : (
                  <Play
                    size={16}
                    className={cn(
                      'transition-colors',
                      isReady &&
                        servicesHealthy &&
                        'text-green-600 hover:text-green-700',
                    )}
                  />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!isReady
                  ? 'Simulation not ready'
                  : !servicesHealthy
                    ? 'Services not healthy'
                    : isRunning
                      ? 'Pause'
                      : isPaused
                        ? 'Resume'
                        : 'Start'}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Stop Button */}
          {isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 transition-all duration-200"
                  onClick={handleStop}
                  disabled={isLoading}
                >
                  <Square
                    size={14}
                    className="text-red-600 transition-colors hover:text-red-700"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Simulation Info */}
        <div className="ml-2 flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium transition-colors',
              getStateColor(),
              !servicesHealthy && 'border-red-200 text-red-600',
            )}
          >
            {getStateText()}
          </Badge>

          <div className="flex items-center gap-1">
            <FileText size={14} />
            <span className="max-w-48 truncate text-sm">
              {getDisplayName()}
            </span>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="border-primary ml-1 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        )}
      </div>
    </div>
  );
};
