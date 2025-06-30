import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, Clock } from 'lucide-react';
import { SldDiagram } from '@/types/sld-diagram';
import { MetadataDisplay } from './metadata-display';

export interface DiagramFooterProps {
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  lastUpdate: Date | null;
  diagramData: SldDiagram | null;
  isRefreshing: boolean;
  isAutoRefreshEnabled: boolean;
  onManualRefresh: () => void;
  onToggleAutoRefresh: () => void;
}

// Nouveau composant pour les contrôles de refresh et statut
const RefreshStatusCard: React.FC<{
  lastUpdate: Date | null;
  isRefreshing: boolean;
  isAutoRefreshEnabled: boolean;
  onManualRefresh: () => void;
  onToggleAutoRefresh: () => void;
  status: string;
}> = ({
  lastUpdate,
  isRefreshing,
  isAutoRefreshEnabled,
  onManualRefresh,
  onToggleAutoRefresh,
  status,
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeSinceLastUpdate = (): string | null => {
    if (!lastUpdate) return null;
    const timeSinceUpdate = currentTime - lastUpdate.getTime();
    const seconds = Math.floor(timeSinceUpdate / 1000);

    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${remainingMinutes}m ago`;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'loaded':
        return 'outline';
      case 'loading':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-4">
          {/* Section status et dernière mise à jour */}
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeSinceLastUpdate()}</span>
                </div>
              </>
            )}

            {/* <Badge variant={getStatusVariant(status)} className="text-xs">
              {status}
            </Badge> */}
          </div>

          {/* Section contrôles de refresh */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {/* Bouton refresh manuel */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onManualRefresh}
                    disabled={isRefreshing}
                    className="h-7 w-7 p-0"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh manually</p>
                </TooltipContent>
              </Tooltip>

              {/* Bouton unifié auto-refresh avec texte */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleAutoRefresh}
                    className="h-6 px-2 gap-1"
                  >
                    <span className="text-xs">
                      {isAutoRefreshEnabled ? 'Auto' : 'Manual'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isAutoRefreshEnabled
                      ? 'Disable auto-refresh'
                      : 'Enable auto-refresh'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DiagramFooter: React.FC<DiagramFooterProps> = ({
  isLoading,
  isLoaded,
  isError,
  lastUpdate,
  diagramData,
  isRefreshing,
  isAutoRefreshEnabled,
  onManualRefresh,
  onToggleAutoRefresh,
}) => {
  const getStatus = () => {
    if (isLoading) return 'Loading';
    if (isLoaded) return 'Loaded';
    if (isError) return 'Error';
    return 'Idle';
  };

  return (
    <div className="flex justify-between items-center w-full h-5">
      <MetadataDisplay diagramData={diagramData} />

      {isLoaded && (
        <RefreshStatusCard
          lastUpdate={lastUpdate}
          isRefreshing={isRefreshing}
          isAutoRefreshEnabled={isAutoRefreshEnabled}
          onManualRefresh={onManualRefresh}
          onToggleAutoRefresh={onToggleAutoRefresh}
          status={getStatus()}
        />
      )}
    </div>
  );
};
