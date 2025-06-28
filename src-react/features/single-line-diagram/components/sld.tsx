import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Pause } from 'lucide-react';
import { useSldStore } from '../stores/sld.store';
import { useSvgRenderer } from '../hooks/use-svg-renderer';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { DiagramContent } from './diagram-content';
import { EmptyState } from './empty-state';
import { DiagramFooter } from './diagram-footer';

export interface SingleLineDiagramProps {
  id: string;
  enableAutoRefreshByDefault?: boolean;
}

export const Sld: React.FC<SingleLineDiagramProps> = ({
  id,
  enableAutoRefreshByDefault = true,
}) => {
  const {
    isLoading,
    isLoaded,
    isError,
    isRefreshing,
    diagramData,
    error,
    lastUpdate,
    isAutoRefreshEnabled,
    loadDiagram,
    retry,
    enableAutoRefresh,
    disableAutoRefresh,
    manualRefresh,
    getTimeSinceLastUpdate,
  } = useSldStore();

  const { svgRef } = useSvgRenderer(diagramData, isLoaded);

  // Utiliser useRef pour éviter les re-renders infinies
  const hasInitializedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);

  // Effect pour charger le diagramme quand l'ID change
  useEffect(() => {
    if (id && currentIdRef.current !== id) {
      currentIdRef.current = id;
      loadDiagram(id);
    }
  }, [id, loadDiagram]);

  // Effect séparé pour l'auto-refresh initial
  useEffect(() => {
    if (!hasInitializedRef.current && enableAutoRefreshByDefault && isLoaded) {
      hasInitializedRef.current = true;
      enableAutoRefresh();
    }
  }, [enableAutoRefreshByDefault, isLoaded, enableAutoRefresh]);

  const handleToggleAutoRefresh = () => {
    if (isAutoRefreshEnabled) {
      disableAutoRefresh();
    } else {
      enableAutoRefresh();
    }
  };

  const handleManualRefresh = () => {
    manualRefresh();
  };

  const renderRefreshControls = () => {
    if (!isLoaded) return null;

    return (
      <div className="flex items-center gap-2">
        {/* Bouton refresh manuel */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="h-8 px-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>

        {/* Toggle auto-refresh */}
        <Button
          variant={isAutoRefreshEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleAutoRefresh}
          className="h-8 px-2"
        >
          {isAutoRefreshEnabled ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {/* Badge statut auto-refresh */}
        <Badge
          variant={isAutoRefreshEnabled ? 'default' : 'secondary'}
          className="text-xs"
        >
          {isAutoRefreshEnabled ? 'Auto' : 'Manuel'}
        </Badge>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState error={error} onRetry={retry} />;
    if (isLoaded && diagramData && diagramData.svg) {
      return <DiagramContent svgRef={svgRef} />;
    }
    return <EmptyState />;
  };

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col border-0 rounded-none p-2 gap-2">
        <CardHeader className="gap-0">
          <CardTitle>
            <div className="flex text-sm items-center justify-between">
              <h1>{id}</h1>
              {renderRefreshControls()}
            </div>
          </CardTitle>
          <CardAction />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {renderContent()}
        </CardContent>

        <CardFooter className="p-0">
          <div className="flex items-center justify-between w-full">
            <DiagramFooter
              isLoading={isLoading}
              isLoaded={isLoaded}
              isError={isError}
              lastUpdate={lastUpdate}
              diagramData={diagramData}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
