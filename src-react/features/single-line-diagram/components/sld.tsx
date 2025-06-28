import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  enableAutoRefreshByDefault = false,
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

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState error={error} onRetry={retry} />;
    if (isLoaded && diagramData && diagramData.svg) {
      return <DiagramContent svgRef={svgRef} diagramData={diagramData}/>;
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
              isRefreshing={isRefreshing}
              isAutoRefreshEnabled={isAutoRefreshEnabled}
              onManualRefresh={handleManualRefresh}
              onToggleAutoRefresh={handleToggleAutoRefresh}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};