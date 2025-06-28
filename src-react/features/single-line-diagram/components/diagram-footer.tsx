import React, { useState, useEffect } from 'react';
import { SldDiagram } from '@/types/sld-diagram';
import { MetadataDisplay } from './metadata-display';

export interface DiagramFooterProps {
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  lastUpdate: Date | null;
  diagramData: SldDiagram | null;
}

export const DiagramFooter: React.FC<DiagramFooterProps> = ({
  isLoading,
  isLoaded,
  isError,
  lastUpdate,
  diagramData,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Met à jour le temps actuel toutes les secondes pour recalculer le temps écoulé
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatus = () => {
    if (isLoading) return 'Loading';
    if (isLoaded) return 'Loaded';
    if (isError) return 'Error';
    return 'Idle';
  };

  const formatTimeSinceLastUpdate = (): string | null => {
    if (!lastUpdate) return null;

    const timeSinceUpdate = currentTime - lastUpdate.getTime();
    const seconds = Math.floor(timeSinceUpdate / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
      <MetadataDisplay diagramData={diagramData} />

      <div className="flex items-center gap-4">
        {lastUpdate && <span>Updated: {formatTimeSinceLastUpdate()}</span>}
        <span>Status: {getStatus()}</span>
      </div>
    </div>
  );
};
