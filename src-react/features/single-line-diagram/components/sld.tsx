import * as d3 from 'd3';
import { Loader2, RefreshCw } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

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

export interface SingleLineDiagram {
  id: string;
}

export const Sld: React.FC<SingleLineDiagram> = ({ id }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    isLoading,
    isLoaded,
    isError,
    diagramData,
    error,
    loadDiagram,
    retry,
  } = useSldStore();

  // Charge automatiquement le diagramme quand l'ID change
  useEffect(() => {
    if (id) {
      loadDiagram(id);
    }
  }, [id, loadDiagram]);

  // Fonction pour rendre le SVG avec D3
  useEffect(() => {
    if (!isLoaded || !diagramData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Nettoie le contenu précédent
    svg.selectAll('*').remove();

    try {
      // Parse le SVG string
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(diagramData.svg, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Récupère les dimensions du SVG original
      const viewBox = svgElement.getAttribute('viewBox');
      const originalWidth = svgElement.getAttribute('width');
      const originalHeight = svgElement.getAttribute('height');

      // Configure le SVG container
      if (viewBox) {
        svg.attr('viewBox', viewBox);
      } else if (originalWidth && originalHeight) {
        svg.attr('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
      }

      // Importe le contenu du SVG
      const svgContent = svgElement.innerHTML;
      svg.node()!.innerHTML = svgContent;

      // Ajoute les fonctionnalités de zoom et pan avec D3
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          const g = svg.select('g.zoom-group');
          if (g.empty()) {
            // Créer un groupe pour le zoom s'il n'existe pas
            const content = svg.node()!.innerHTML;
            svg.node()!.innerHTML = '';
            const zoomGroup = svg.append('g').attr('class', 'zoom-group');
            zoomGroup.node()!.innerHTML = content;
          }
          svg.select('g.zoom-group').attr('transform', event.transform);
        });

      svg.call(zoom);

      // Wrap le contenu existant dans un groupe pour le zoom
      if (svg.select('g.zoom-group').empty()) {
        const content = svg.node()!.innerHTML;
        svg.node()!.innerHTML = '';
        const zoomGroup = svg.append('g').attr('class', 'zoom-group');
        zoomGroup.node()!.innerHTML = content;
      }

      // Ajuste la taille du SVG au container
      svg.attr('width', '100%').attr('height', '100%');

      // Ajoute des événements aux éléments interactifs si nécessaire
    } catch (error) {
      console.error('Erreur lors du rendu SVG:', error);
    }
  }, [isLoaded, diagramData]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Chargement du diagramme...</p>
          </div>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-destructive">
              <p className="font-semibold">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      );
    }

    if (isLoaded && diagramData) {
      return (
        <div className="h-full flex flex-col">
          {/* Container SVG avec D3 */}
          <div className="flex-1 overflow-hidden bg-muted/25 border-1 rounded">
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Informations sur les métadonnées */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Composants: </span>
                <span className="text-primary">
                  {diagramData.metadata.components.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Nœuds: </span>
                <span className="text-primary">
                  {diagramData.metadata.nodes.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Fils: </span>
                <span className="text-primary">
                  {diagramData.metadata.wires.length}
                </span>
              </div>
              <div>
                <span className="font-medium">Feeders: </span>
                <span className="text-primary">
                  {diagramData.metadata.feederInfos.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Aucun diagramme chargé</p>
      </div>
    );
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
          <CardAction></CardAction>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {renderContent()}
        </CardContent>

        <CardFooter>
          <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
            <span>
              État:{' '}
              {isLoading
                ? 'Chargement'
                : isLoaded
                  ? 'Chargé'
                  : isError
                    ? 'Erreur'
                    : 'Inactif'}
            </span>
            {diagramData && (
              <span>
                Dimensions:{' '}
                {diagramData.metadata.layoutParams?.cellWidth || 'N/A'}px
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
