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

  // Créer la ref SVG directement ici
  const svgRef = useRef<SVGSVGElement>(null);

  // Utiliser useRef pour éviter les re-renders infinies
  const hasInitializedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const hasDataRef = useRef(false);

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

  // Tracking si on a déjà des données pour éviter la recréation
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

  // Fonction pour déterminer si on doit afficher le DiagramContent
  const shouldShowDiagram = () => {
    // Afficher le diagramme si on a des données OU si on est en train de rafraîchir
    return (
      (isLoaded && diagramData?.svg) || (isRefreshing && hasDataRef.current)
    );
  };

  // Fonction pour déterminer si on doit afficher l'overlay de loading
  const shouldShowLoadingOverlay = () => {
    return (
      (isLoading && !hasDataRef.current) || (isRefreshing && hasDataRef.current)
    );
  };

  const renderContent = () => {
    // Si on a une erreur et pas de données, afficher l'erreur
    if (isError && !hasDataRef.current) {
      return <ErrorState error={error} onRetry={retry} />;
    }

    // Si on doit afficher le diagramme
    if (shouldShowDiagram()) {
      return (
        <div className="relative h-full">
          {/* DiagramContent est maintenant TOUJOURS monté une fois qu'on a des données */}
          <DiagramContent svgRef={svgRef} diagramData={diagramData} />

          {/* Overlay de loading pendant le refresh */}
          {shouldShowLoadingOverlay() && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Chargement...' : 'Actualisation...'}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Si on charge pour la première fois
    if (isLoading && !hasDataRef.current) {
      return <LoadingState />;
    }

    // État vide par défaut
    return <EmptyState />;
  };

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col border-0 rounded-none p-2 gap-2">
        <CardHeader className="gap-0">
          <CardTitle>
            <div className="flex text-sm items-center justify-between">
              <h1>{id}</h1>
              {/* Indicateur de statut */}
              <div className="flex items-center gap-2">
                {isRefreshing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
                {isError && hasDataRef.current && (
                  <div
                    className="w-2 h-2 bg-yellow-500 rounded-full"
                    title="Erreur de refresh"
                  />
                )}
                {isAutoRefreshEnabled && (
                  <div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    title="Auto-refresh activé"
                  />
                )}
              </div>
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
