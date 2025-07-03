import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

import { SldProvider, useSldContext } from '../providers/sld.provider';
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

const SldInner: React.FC<SingleLineDiagramProps> = ({
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
    isAutoRefreshEnabled,
    retry,
    enableAutoRefresh,
    isReady,
    currentId,
  } = useSldContext();

  const autoRefreshInitializedRef = useRef(false);
  const hasDataRef = useRef(false);

  useEffect(() => {
    if (
      enableAutoRefreshByDefault &&
      isLoaded &&
      !autoRefreshInitializedRef.current &&
      !isAutoRefreshEnabled
    ) {
      enableAutoRefresh();
      autoRefreshInitializedRef.current = true;
    }
  }, [
    enableAutoRefreshByDefault,
    isLoaded,
    isAutoRefreshEnabled,
    enableAutoRefresh,
  ]);

  useEffect(() => {
    if (diagramData?.svg) {
      hasDataRef.current = true;
    } else {
      hasDataRef.current = false;
    }
  }, [diagramData?.svg]);

  useEffect(() => {
    if (currentId !== id) {
      autoRefreshInitializedRef.current = false;
      hasDataRef.current = false;
    }
  }, [currentId, id]);

  const shouldShowDiagram = () => {
    return (
      (isLoaded && diagramData?.svg) || (isRefreshing && hasDataRef.current)
    );
  };

  const shouldShowLoadingOverlay = () => {
    return isRefreshing && hasDataRef.current;
  };

  const renderContent = () => {
    if (!isReady) {
      return <LoadingState />;
    }

    if (isError && !hasDataRef.current) {
      return <ErrorState error={error} onRetry={retry} />;
    }

    if (shouldShowDiagram()) {
      return (
        <div className="relative h-full">
          <DiagramContent />

          {shouldShowLoadingOverlay() && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Refreshing...
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
        <CardHeader className="p-0 gap-0">
          <DiagramHeader id={id} hasDataRef={hasDataRef} />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 m-0">
          {renderContent()}
        </CardContent>

        <CardFooter className="p-0">
          <DiagramFooter />
        </CardFooter>
      </Card>
    </div>
  );
};

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = (props) => {
  return (
    <SldProvider id={props.id}>
      <SldInner {...props} />
    </SldProvider>
  );
};
