import { Play, Square, Pause, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDsl, useStopDsl } from '../provider/dsl.provider';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAtomSet } from '@effect-atom/atom-react';

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
    isRunning: providerIsRunning, // État du provider
  } = useDsl();

  const { stopOrchestrator, isStopping, stopError } = useStopDsl();

  // État local pour pause (le running vient maintenant du provider)
  const [isPaused, setIsPaused] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Utiliser l'état du provider pour déterminer si on est en cours d'exécution
  const isRunning = providerIsRunning && !isPaused;
  const isActive = providerIsRunning; // Actif si le provider dit qu'on est running
  const isLoading = isActionLoading || isStarting || isStopping || dslLoading;

  const handlePlay = async () => {
    if (!isReady || isLoading) return;

    try {
      setIsActionLoading(true);

      if (!providerIsRunning) {
        // Démarrer la simulation via le provider
        await startDslFile();
        // Le provider gère isRunning automatiquement
      } else if (isPaused) {
        // Resume logic (local state seulement)
        setIsPaused(false);
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
      // Pause locale seulement (pas d'appel au provider)
      setIsPaused(true);
      console.log('Simulation paused');
    } catch (error) {
      console.error('Error pausing simulation:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!providerIsRunning || isLoading) return;

    try {
      setIsActionLoading(true);
      // Utiliser la fonction stop du provider
      await stopOrchestrator();

      // Réinitialiser l'état local de pause
      setIsPaused(false);

      console.log('Simulation stopped');
    } catch (error) {
      console.error('Error stopping simulation:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStateColor = () => {
    if (!providerIsRunning) {
      return 'text-color border-border';
    }

    if (isPaused) {
      return 'text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]';
    }

    return 'text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]';
  };

  const getStateText = () => {
    if (!isReady) return 'Not Ready';
    if (!servicesHealthy) return 'Services Down';

    if (providerIsRunning) {
      return isPaused ? 'Paused' : 'Running';
    }

    return simulationStatus === 'ready' ? 'Ready' : 'Not Ready';
  };

  // Fonction pour obtenir le nom à afficher
  const getDisplayName = () => {
    return simulationName || 'No file';
  };

  // Fonction pour obtenir le nom tronqué selon l'écran
  const getTruncatedName = () => {
    const name = getDisplayName();
    // Limiter la longueur pour le header
    if (name.length > 15) {
      return name.substring(0, 12) + '...';
    }
    return name;
  };

  // Afficher les erreurs de démarrage et d'arrêt
  const hasError = !!(startError || stopError);
  const currentError = startError || stopError;

  return (
    <div className="flex flex-row gap-1">
      {/* Affichage des erreurs - version compacte */}
      {hasError && (
        <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
          <span className="font-medium">Error:</span>{' '}
          <span className="hidden sm:inline">{currentError}</span>
          <span className="sm:hidden">Check logs</span>
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-1 rounded border px-2 py-1 transition-all duration-200',
          'max-w-full min-w-0', // Contraintes de taille
          isRunning && 'border-green-500/40 bg-green-500/5',
          isPaused &&
            providerIsRunning &&
            'border-yellow-500/40 bg-yellow-500/5',
          hasError && 'border-red-500/40 bg-red-500/5',
          !isRunning && !isPaused && !hasError && 'border-border bg-background',
        )}
      >
        <div className="flex flex-shrink-0 items-center gap-1">
          {/* Play/Pause Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-5 w-5 p-0 transition-all duration-200',
                  (!isReady || !servicesHealthy) &&
                    'cursor-not-allowed opacity-50',
                )}
                onClick={isRunning ? handlePause : handlePlay}
                disabled={!isReady || !servicesHealthy || isLoading}
              >
                {isRunning ? (
                  <Pause
                    size={14}
                    className="text-yellow-600 transition-colors hover:text-yellow-700"
                  />
                ) : (
                  <Play
                    size={14}
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
                  ? 'Not ready'
                  : !servicesHealthy
                    ? 'Services down'
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
                  className="h-7 w-7 p-0 transition-all duration-200"
                  onClick={handleStop}
                  disabled={isLoading}
                >
                  <Square
                    size={13}
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
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* État avec point coloré */}
          <div className="flex flex-shrink-0 items-center gap-1">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                !providerIsRunning && 'bg-gray-400',
                isPaused && providerIsRunning && 'bg-yellow-500',
                isRunning && 'bg-green-500',
                !servicesHealthy && 'bg-red-500',
              )}
            />
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {getStateText()}
            </span>
          </div>

          {/* Nom du fichier */}
          <div className="flex min-w-0 items-center gap-1">
            <FileText
              size={12}
              className="text-muted-foreground flex-shrink-0"
            />
            <span className="max-w-[120px] min-w-0 truncate text-xs">
              {getDisplayName()}
            </span>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="border-primary h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-t-transparent" />
          )}
        </div>
      </div>
    </div>
  );
};
