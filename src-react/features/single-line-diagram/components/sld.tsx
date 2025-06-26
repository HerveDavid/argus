import * as d3 from 'd3';
import { Loader2, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useSldStore } from '../stores/sld.store';
import { SldDiagram } from '@/types/sld-diagram';

export interface SingleLineDiagramProps {
  id: string;
}

// Hook personnalisé pour la logique SVG
const useSvgRenderer = (diagramData: SldDiagram | null, isLoaded: boolean) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const setupZoom = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        svg.select('g.zoom-group').attr('transform', event.transform);
      });

    svg.call(zoom);
  }, []);

  const wrapContentInZoomGroup = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    if (svg.select('g.zoom-group').empty()) {
      const content = svg.node()!.innerHTML;
      svg.node()!.innerHTML = '';
      const zoomGroup = svg.append('g').attr('class', 'zoom-group');
      zoomGroup.node()!.innerHTML = content;
    }
  }, []);

  const renderSvg = useCallback(async () => {
    // Vérifications plus strictes
    if (!isLoaded || !diagramData || !diagramData.svg || !svgRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    try {
      // Vérification supplémentaire que svg est bien un Blob
    

      // Parse le SVG depuis le Blob
      const svgText = await diagramData.svg;
      
      if (!svgText || svgText.trim() === '') {
        console.error('Le contenu SVG est vide');
        return;
      }

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      
      // Vérifier s'il y a des erreurs de parsing
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        console.error('Erreur de parsing SVG:', parserError.textContent);
        return;
      }

      const svgElement = svgDoc.documentElement;
      
      if (!svgElement || svgElement.tagName !== 'svg') {
        console.error('Document SVG invalide');
        return;
      }

      // Configure les dimensions
      const viewBox = svgElement.getAttribute('viewBox');
      const originalWidth = svgElement.getAttribute('width');
      const originalHeight = svgElement.getAttribute('height');

      if (viewBox) {
        svg.attr('viewBox', viewBox);
      } else if (originalWidth && originalHeight) {
        svg.attr('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
      }

      // Importe le contenu
      svg.node()!.innerHTML = svgElement.innerHTML;
      
      // Configure les dimensions responsives
      svg.attr('width', '100%').attr('height', '100%');

      // Setup zoom et pan
      wrapContentInZoomGroup(svg);
      setupZoom(svg);

    } catch (error) {
      console.error('Erreur lors du rendu SVG:', error);
    }
  }, [isLoaded, diagramData, setupZoom, wrapContentInZoomGroup]);

  useEffect(() => {
    // Ajouter un délai pour s'assurer que les données sont complètement chargées
    if (isLoaded && diagramData && diagramData.svg) {
      const timeoutId = setTimeout(() => {
        renderSvg();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [renderSvg, isLoaded, diagramData]);

  return { svgRef };
};

// Composant pour l'état de chargement
const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-muted-foreground">Chargement du diagramme...</p>
    </div>
  </div>
);

// Composant pour l'état d'erreur
const ErrorState: React.FC<{ error: string | null; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="text-destructive">
        <p className="font-semibold">Erreur de chargement</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  </div>
);

// Composant pour les métadonnées
const MetadataDisplay: React.FC<{ diagramData: SldDiagram }> = ({ diagramData }) => (
  <div className="mt-4 p-3 bg-muted rounded-lg">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="font-medium">Composants: </span>
        <span className="text-primary">
          {diagramData.metadata?.components?.length || 0}
        </span>
      </div>
      <div>
        <span className="font-medium">Nœuds: </span>
        <span className="text-primary">
          {diagramData.metadata?.nodes?.length || 0}
        </span>
      </div>
      <div>
        <span className="font-medium">Fils: </span>
        <span className="text-primary">
          {diagramData.metadata?.wires?.length || 0}
        </span>
      </div>
      <div>
        <span className="font-medium">Feeders: </span>
        <span className="text-primary">
          {diagramData.metadata?.feederInfos?.length || 0}
        </span>
      </div>
    </div>
  </div>
);

// Composant pour le contenu du diagramme
const DiagramContent: React.FC<{ 
  diagramData: SldDiagram; 
  svgRef: React.RefObject<SVGSVGElement>;
}> = ({ diagramData, svgRef }) => (
  <div className="h-full flex flex-col">
    <div className="flex-1 overflow-hidden bg-muted/25 border-1 rounded">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
    <MetadataDisplay diagramData={diagramData} />
  </div>
);

// Composant pour l'état vide
const EmptyState: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <p className="text-muted-foreground">Aucun diagramme chargé</p>
  </div>
);

// Composant pour le footer
const DiagramFooter: React.FC<{
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  diagramData: SldDiagram | null;
}> = ({ isLoading, isLoaded, isError, diagramData }) => {
  const getStatus = () => {
    if (isLoading) return 'Chargement';
    if (isLoaded) return 'Chargé';
    if (isError) return 'Erreur';
    return 'Inactif';
  };

  const getDimensions = () => {
    return diagramData?.metadata?.layoutParams?.cellWidth || 'N/A';
  };

  return (
    <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
      <span>État: {getStatus()}</span>
      {diagramData && (
        <span>Dimensions: {getDimensions()}px</span>
      )}
    </div>
  );
};

// Composant principal
export const Sld: React.FC<SingleLineDiagramProps> = ({ id }) => {
  const {
    isLoading,
    isLoaded,
    isError,
    diagramData,
    error,
    loadDiagram,
    retry,
  } = useSldStore();

  const { svgRef } = useSvgRenderer(diagramData, isLoaded);

  // Charge le diagramme quand l'ID change
  useEffect(() => {
    if (id) {
      loadDiagram(id);
    }
  }, [id, loadDiagram]);

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState error={error} onRetry={retry} />;
    if (isLoaded && diagramData && diagramData.svg) {
      return <DiagramContent diagramData={diagramData} svgRef={svgRef} />;
    }
    return <EmptyState />;
  };

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col border-0 rounded-none">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <h1>{id}</h1>
            </div>
          </CardTitle>
          <CardAction />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {renderContent()}
        </CardContent>

        <CardFooter>
          <DiagramFooter 
            isLoading={isLoading}
            isLoaded={isLoaded}
            isError={isError}
            diagramData={diagramData}
          />
        </CardFooter>
      </Card>
    </div>
  );
};