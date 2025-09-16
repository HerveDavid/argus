import { Play, Square, Pause, FileText } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { invoke } from '@tauri-apps/api/core';
import { useDsl } from '../provider/dsl.provider';
import { cn } from '@/lib/utils';

type SimulationState = 'idle' | 'running' | 'paused';

export const DslCommands = () => {
  const {
    simulationConfig,
    initScenarioRequest,
    isLoading: dslLoading,
  } = useDsl();

  const [simulationState, setSimulationState] =
    useState<SimulationState>('idle');
  const [isLoading, setIsLoading] = useState(false);

  const isReady = !!simulationConfig;
  const isRunning = simulationState === 'running';
  const isPaused = simulationState === 'paused';
  const isActive = isRunning || isPaused; // Simulation active (running ou paused)

  const handlePlay = async () => {
    if (!isReady || isLoading) return;

    try {
      setIsLoading(true);

      if (simulationState === 'idle' || simulationState === 'paused') {
        await invoke('start_dsl_file');
        setSimulationState('running');
        console.log('Simulation started');
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!isRunning || isLoading) return;

    try {
      setIsLoading(true);
      // await invoke('pause_dsl_file');
      setSimulationState('paused');
      console.log('Simulation paused');
    } catch (error) {
      console.error('Error pausing simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (simulationState === 'idle' || isLoading) return;

    try {
      setIsLoading(true);
      // await invoke('stop_dsl_file');
      setSimulationState('idle');
      console.log('Simulation stopped');
    } catch (error) {
      console.error('Error stopping simulation:', error);
    } finally {
      setIsLoading(false);
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
    switch (simulationState) {
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      default:
        return 'Ready';
    }
  };

  // Fonction pour obtenir le nom à afficher
  const getDisplayName = () => {
    return initScenarioRequest?.simulation_name || 'No file';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg p-2 transition-all duration-200',
        isRunning && 'border-2 border-green-500/30 bg-green-500/10',
      )}
    >
      <div className="flex items-center gap-1">
        {/* Play/Pause Button - Se transforme selon l'état */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0 transition-all duration-200',
                !isReady && 'cursor-not-allowed opacity-50',
              )}
              onClick={isRunning ? handlePause : handlePlay}
              disabled={!isReady || isLoading || dslLoading}
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
                    isReady && 'text-green-600 hover:text-green-700',
                  )}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRunning ? 'Pause' : isPaused ? 'Resume' : 'Play'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Stop Button - Visible seulement si la simulation est active */}
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
        {isReady ? (
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium transition-colors',
              getStateColor(),
            )}
          >
            {getStateText()}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-xs font-medium"
          >
            Not Ready
          </Badge>
        )}

        <div className="flex items-center gap-1">
          <FileText size={14} />
          <span className="max-w-48 truncate text-sm">
            {getDisplayName()}
          </span>
        </div>
      </div>

      {/* Loading indicator */}
      {(isLoading || dslLoading) && (
        <div className="border-primary ml-1 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
      )}
    </div>
  );
};
