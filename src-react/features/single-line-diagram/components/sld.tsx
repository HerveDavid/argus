import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { useSldStore } from '../stores/sld.store';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { DiagramContent } from './diagram-content';
import { EmptyState } from './empty-state';
import { DiagramFooter } from './diagram-footer';
import { DiagramHeader } from './diagram-header';

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

  const svgRef = useRef<SVGSVGElement>(null);

  const hasInitializedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (id && currentIdRef.current !== id) {
      currentIdRef.current = id;
      loadDiagram(id);
    }
  }, [id, loadDiagram]);

  useEffect(() => {
    if (!hasInitializedRef.current && enableAutoRefreshByDefault && isLoaded) {
      hasInitializedRef.current = true;
      enableAutoRefresh();
    }
  }, [enableAutoRefreshByDefault, isLoaded, enableAutoRefresh]);

  useEffect(() => {
    if (diagramData?.svg && !hasDataRef.current) {
      hasDataRef.current = true;
    }
  }, [diagramData?.svg]);

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

  const shouldShowDiagram = () => {
    return (
      (isLoaded && diagramData?.svg) || (isRefreshing && hasDataRef.current)
    );
  };

  const shouldShowLoadingOverlay = () => {
    return (
      (isLoading && !hasDataRef.current) || (isRefreshing && hasDataRef.current)
    );
  };

  const renderContent = () => {
    if (isError && !hasDataRef.current) {
      return <ErrorState error={error} onRetry={retry} />;
    }

    if (shouldShowDiagram()) {
      return (
        <div className="relative h-full">
          <DiagramContent svgRef={svgRef} diagramData={diagramData} />

          {shouldShowLoadingOverlay() && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : 'Refresh...'}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // First load
    if (isLoading && !hasDataRef.current) {
      return <LoadingState />;
    }

    return <EmptyState />;
  };

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col border-0 rounded-none p-2 gap-2">
        <CardHeader className="gap-0">
          <DiagramHeader
            isRefreshing={isRefreshing}
            isError={isError}
            isAutoRefreshEnabled={isAutoRefreshEnabled}
            hasDataRef={hasDataRef}
            id={id}
          />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {renderContent()}
        </CardContent>

        <CardFooter className="p-0">
          <div className="flex items-center justify-between w-full">
            <DiagramFooter
              isLoading={isLoading && !hasDataRef.current}
              isLoaded={isLoaded || hasDataRef.current}
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
